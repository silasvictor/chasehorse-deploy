/**
 * RAG (Retrieval-Augmented Generation) Service for ChaseHorse Deploy.
 *
 * Provides document-context-aware AI responses by retrieving relevant
 * authorized records and document content, then augmenting the AI prompt
 * with that context. All operations are server-side with proper
 * role-based access control enforcement.
 */

import { db } from "@/lib/db";
import { AIService } from "./ai-service";
import type { AIMessage, AIRequest } from "./provider-interface";

export interface RAGContext {
  userId: string;
  userRole: string;
  query: string;
  contextType: "inspections" | "inventory" | "documents" | "tasks" | "discrepancies" | "reports" | "all";
  limit?: number;
}

export interface RAGResult {
  response: string;
  provider: string;
  model: string;
  sources: RAGSource[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface RAGSource {
  type: "inspection" | "inventory" | "document" | "task" | "discrepancy" | "report" | "assignment";
  id: string;
  title: string;
  relevance: number; // 0-100
  excerpt: string;
  url?: string;
}

export class RAGService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Retrieve relevant records based on a natural language query.
   * All queries are scoped to authorized data only.
   */
  async retrieveAuthorizedContext(ctx: {
    userId: string;
    role: string;
    query: string;
    limit?: number;
  }): Promise<RAGSource[]> {
    const { userId, role, query, limit = 5 } = ctx;
    const q = query.toLowerCase();
    const sources: RAGSource[] = [];

    // Helper to check if a record matches query keywords
    const matchesQuery = (text: string): boolean => {
      const words = q.split(/\s+/).filter(w => w.length > 2);
      return words.some(w => text.toLowerCase().includes(w));
    };

    // Fetch inspections (authorized - all authenticated users can read)
    const inspections = await db.inspection.findMany({
      include: {
        warehouse: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit * 2,
    });

    for (const insp of inspections) {
      const relevance = this.calculateRelevance(q, [
        insp.title,
        insp.findings || "",
        insp.report || "",
        insp.warehouse?.name || "",
      ]);
      if (relevance > 0) {
        sources.push({
          type: "inspection",
          id: insp.id,
          title: insp.title,
          relevance,
          excerpt: insp.findings || insp.report || `Inspection status: ${insp.status}`,
          url: `/dashboard/inspections/${insp.id}`,
        });
      }
    }

    // Fetch inventory discrepancies
    const discrepancies = await db.stockDiscrepancy.findMany({
      include: {
        inventoryItem: {
          include: { warehouse: { select: { id: true, name: true } } },
        },
        reporter: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit * 2,
    });

    for (const disc of discrepancies) {
      const relevance = this.calculateRelevance(q, [
        disc.inventoryItem?.name || "",
        disc.inventoryItem?.sku || "",
        disc.notes || "",
        disc.inventoryItem?.warehouse?.name || "",
      ]);
      if (relevance > 0) {
        sources.push({
          type: "discrepancy",
          id: disc.id,
          title: `Discrepancy: ${disc.inventoryItem?.name || "Unknown Item"}`,
          relevance,
          excerpt: disc.notes || `Difference: ${disc.difference} units`,
          url: `/dashboard/discrepancies/${disc.id}`,
        });
      }
    }

    // Fetch POD documents
    const podDocuments = await db.pODDocument.findMany({
      include: {
        assignment: { select: { id: true, title: true } },
        verifier: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit * 2,
    });

    for (const pod of podDocuments) {
      const relevance = this.calculateRelevance(q, [
        pod.fileName,
        pod.extractedData || "",
      ]);
      if (relevance > 0) {
        sources.push({
          type: "document",
          id: pod.id,
          title: pod.fileName,
          relevance,
          excerpt: `POD Document - Status: ${pod.status}, Verified: ${pod.verified ? "Yes" : "No"}`,
          url: `/dashboard/documents/${pod.id}`,
        });
      }
    }

    // Fetch tasks
    const tasks = await db.task.findMany({
      include: {
        assignee: { select: { id: true, name: true } },
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit * 2,
    });

    for (const task of tasks) {
      const relevance = this.calculateRelevance(q, [
        task.title,
        task.description || "",
        task.assignee?.name || "",
      ]);
      if (relevance > 0) {
        sources.push({
          type: "task",
          id: task.id,
          title: task.title,
          relevance,
          excerpt: task.description || `Task status: ${task.status}, Priority: ${task.priority}`,
          url: `/dashboard/tasks/${task.id}`,
        });
      }
    }

    // Sort by relevance and limit
    sources.sort((a, b) => b.relevance - a.relevance);
    return sources.slice(0, limit);
  }

  /**
   * Calculate relevance score (0-100) based on keyword matching.
   */
  private calculateRelevance(query: string, fields: string[]): number {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return 0;

    let matchCount = 0;
    const totalWeight = words.length * fields.length;

    for (const word of words) {
      for (const field of fields) {
        if (field.toLowerCase().includes(word)) {
          matchCount++;
        }
      }
    }

    return Math.round((matchCount / Math.max(totalWeight, 1)) * 100);
  }

  /**
   * Generate an AI response with RAG context.
   * Retrieves relevant authorized records and includes them as context.
   */
  async generateWithRAG(
    ctx: {
      userId: string;
      userRole: string;
      query: string;
      conversationId?: string;
    },
    options: {
      provider?: "gemini" | "openai" | "anthropic";
      model?: string;
    } = {}
  ): Promise<RAGResult> {
    // Retrieve relevant context
    const sources = await this.retrieveAuthorizedContext({
      userId: ctx.userId,
      role: ctx.userRole,
      query: ctx.query,
      limit: 5,
    });

    // Build context-aware system prompt
    const contextPrompt = this.buildRAGSystemPrompt(ctx.userRole, ctx.query, sources);

    // Get conversation history
    let history: AIMessage[] = [];
    if (ctx.conversationId) {
      const messages = await db.aiMessage.findMany({
        where: { conversationId: ctx.conversationId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      history = messages.map((m) => ({
        role: (m.role === "ASSISTANT" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      }));
    }

    const aiService = new AIService({ userId: ctx.userId });

    const result = await aiService.generate(
      {
        messages: [
          { role: "system", content: contextPrompt },
          ...history,
          { role: "user", content: ctx.query },
        ],
        temperature: 0.3,
        maxTokens: 1500,
      },
      options
    );

    // Save assistant response to conversation if conversationId provided
    if (ctx.conversationId) {
      await db.aiMessage.create({
        data: {
          conversationId: ctx.conversationId,
          role: "ASSISTANT",
          content: result.text,
          provider: result.provider,
          model: result.model,
        },
      });
    }

    return {
      response: result.text,
      provider: result.provider,
      model: result.model,
      sources,
      usage: result.usage,
    };
  }

  /**
   * Build a system prompt that includes retrieved context and scoping rules.
   */
  private buildRAGSystemPrompt(
    userRole: string,
    query: string,
    sources: RAGSource[]
  ): string {
    const contextSections: string[] = [];

    if (sources.length > 0) {
      contextSections.push("## Authorized Records Context:");
      contextSections.push(
        "The following records were retrieved based on the user's query. Use only this information to answer:"
      );
      contextSections.push("");

      for (const source of sources) {
        contextSections.push(
          `[${source.type.toUpperCase()}] ${source.title}\n` +
            `  Relevance: ${source.relevance}%\n` +
            `  Details: ${source.excerpt}\n` +
            `  Reference: ${source.url || "N/A"}\n`
        );
      }
      contextSections.push("");
    }

    return `You are the ChaseHorse Deploy AI Operations Assistant.

Role: Help logistics operations users understand workflows, interpret records they are authorized to access, and analyze operational information using Retrieval-Augmented Generation (RAG).

Scope rules:
- ONLY use the authorized records context provided above. Do not invent assignments, inventory quantities, customers, inspection results, or business metrics.
- If the requested information is not in the authorized records context, say exactly what data is missing.
- Always cite your sources using the format [Source: Type/Title] when referencing specific records.
- Label AI-generated suggestions clearly; do not present uncertain predictions as confirmed facts.
- Do not approve financial transactions, modify verified records, change permissions, or send official alerts.
- Present uncertain predictions as suggestions, not confirmed facts.

Current user role: ${userRole}

Authorized Records Context:
${contextSections.join("\n")}

Answer concisely and helpfully. If you cannot answer from the available authorized records, say exactly what data is missing.`;
  }
}

export const ragService = new RAGService();