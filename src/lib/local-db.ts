import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// File path for persistence in dev/local mode
const STORAGE_DIR = path.join(process.cwd(), "storage");
const DATA_FILE = path.join(STORAGE_DIR, "data.json");

function generateUuid(): string {
  return crypto.randomUUID();
}

// Generate static precomputed bcrypt hash for 'password123'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("password123", 10);

interface LocalStoreData {
  users: any[];
  warehouses: any[];
  inventoryItems: any[];
  stockDiscrepancies: any[];
  inspections: any[];
  qualityInspectionRecords: any[];
  loadingUnloadingChecklists: any[];
  podDocuments: any[];
  tasks: any[];
  reports: any[];
  notifications: any[];
  aiConversations: any[];
  aiMessages: any[];
  documents: any[];
  auditLogs: any[];
  systemSettings: any[];
  assignments: any[];
  // Multi-tenancy & Business Workflows
  organizations: any[];
  organizationMembers: any[];
  invoices: any[];
  invoiceLineItems: any[];
  vendors: any[];
  capaRecords: any[];
  capaActions: any[];
  passwordResetTokens: any[];
  shipments: any[];
}

function getInitialSeedData(): LocalStoreData {
  const adminId = "a1111111-1111-4111-a111-111111111111";
  const opsId = "b2222222-2222-4222-b222-222222222222";
  const inspId = "c3333333-3333-4333-c333-333333333333";
  const auditId = "d4444444-4444-4444-d444-444444444444";
  const demoId = "demo-user-000000000001";

  const wh1 = "wh-00000001-0000-0000-0000-000000000001";
  const wh2 = "wh-00000002-0000-0000-0000-000000000002";
  const wh3 = "wh-00000003-0000-0000-0000-000000000003";
  const wh4 = "wh-00000004-0000-0000-0000-000000000004";

  const users = [
    {
      id: adminId,
      name: "Admin User",
      email: "admin@chasehorse.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "ADMINISTRATOR",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: opsId,
      name: "Sarah Jenkins",
      email: "operations@chasehorse.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "OPERATIONS_MANAGER",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: inspId,
      name: "Rahul Sharma",
      email: "inspector@chasehorse.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "FIELD_INSPECTOR",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: auditId,
      name: "Ananya Iyer",
      email: "auditor@chasehorse.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "AUDITOR",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: demoId,
      name: "Demo User",
      email: "demo@chasehorse.example",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "READ_ONLY_VIEWER",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const warehouses = [
    {
      id: wh1,
      name: "Bhiwandi Central Fulfillment Hub",
      code: "BHW-01",
      address: "Survey No. 42, Rahnal Village, Bhiwandi",
      city: "Thane",
      country: "India",
      contactName: "Rajesh Patil",
      contactPhone: "+91 98200 11223",
      capacity: "50,000 sq ft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: wh2,
      name: "NCR Logistics & Cross-Dock Hub",
      code: "DEL-02",
      address: "Sector 8, IMT Manesar",
      city: "Gurugram",
      country: "India",
      contactName: "Vikram Malhotra",
      contactPhone: "+91 98110 33445",
      capacity: "35,000 sq ft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: wh3,
      name: "Bangalore Whitefield Distribution Center",
      code: "BLR-03",
      address: "EPIP Zone, Whitefield",
      city: "Bengaluru",
      country: "India",
      contactName: "Karthik Swaminathan",
      contactPhone: "+91 99000 55667",
      capacity: "42,000 sq ft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: wh4,
      name: "Chennai Ennore Port CFS",
      code: "MAA-04",
      address: "Express Highway, Ennore Port",
      city: "Chennai",
      country: "India",
      contactName: "Senthil Kumar",
      contactPhone: "+91 94440 77889",
      capacity: "28,000 sq ft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const item1 = "inv-0001-0000-0000-0000-000000000001";
  const item2 = "inv-0002-0000-0000-0000-000000000002";
  const item3 = "inv-0003-0000-0000-0000-000000000003";
  const item4 = "inv-0004-0000-0000-0000-000000000004";

  const inventoryItems = [
    {
      id: item1,
      warehouseId: wh1,
      sku: "ELEC-INV-5KW",
      name: "Solar Hybrid Inverter 5kW",
      quantity: 142,
      unit: "units",
      minThreshold: 30,
      location: "Aisle 3 - Bay 12",
      lastCountedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: item2,
      warehouseId: wh1,
      sku: "SOLAR-MOD-550W",
      name: "Mono PERC Solar Module 550W",
      quantity: 860,
      unit: "pcs",
      minThreshold: 200,
      location: "Rack B - Floor Stack 4",
      lastCountedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: item3,
      warehouseId: wh2,
      sku: "AUTO-BRG-6204",
      name: "High Precision Bearings 6204",
      quantity: 1250,
      unit: "boxes",
      minThreshold: 150,
      location: "Zone C - Bin 402",
      lastCountedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: item4,
      warehouseId: wh3,
      sku: "FMCG-BEV-TETRA",
      name: "Aseptic Tetra Packs 1L (Case of 12)",
      quantity: 480,
      unit: "cases",
      minThreshold: 100,
      location: "Cold Staging Bay 1",
      lastCountedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];

  const stockDiscrepancies = [
    {
      id: "disc-0001-0000-0000-0000-000000000001",
      inventoryItemId: item1,
      recordedQty: 146,
      countedQty: 142,
      difference: -4,
      status: "OPEN",
      notes: "4 units short during cycle count in Aisle 3. Reviewing gate pass records.",
      reportedById: inspId,
      resolvedById: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "disc-0002-0000-0000-0000-000000000002",
      inventoryItemId: item3,
      recordedQty: 1238,
      countedQty: 1250,
      difference: 12,
      status: "UNDER_REVIEW",
      notes: "Excess 12 boxes found. Unlabelled inbound shipment batch reconciled with PO-4920.",
      reportedById: opsId,
      resolvedById: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const asg1 = "asg-0001-0000-0000-0000-000000000001";
  const asg2 = "asg-0002-0000-0000-0000-000000000002";

  const assignments = [
    {
      id: asg1,
      title: "Inbound Dispatch Inspection — Bhiwandi Central",
      description: "Supervise arrival of 40ft container MH-04-AB-1294 and perform physical seal check & cargo condition verification.",
      status: "IN_PROGRESS",
      priority: "high",
      location: "Bhiwandi Central Fulfillment Hub",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      completedAt: null,
      assigneeId: inspId,
      creatorId: opsId,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: asg2,
      title: "Quarterly Comprehensive Safety & GST Audit",
      description: "Conduct GST compliance documentation check, e-way bill reconciliation, and warehouse safety condition assessment.",
      status: "ASSIGNED",
      priority: "medium",
      location: "NCR Logistics & Cross-Dock Hub",
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      startedAt: null,
      completedAt: null,
      assigneeId: auditId,
      creatorId: adminId,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  const insp1 = "insp-0001-0000-0000-0000-000000000001";
  const insp2 = "insp-0002-0000-0000-0000-000000000002";
  const insp3 = "insp-0003-0000-0000-0000-000000000003";

  const inspections = [
    {
      id: insp1,
      title: "Inbound Cargo Verification — Container MH-04-AB-1294",
      type: "LOADING_UNLOADING",
      status: "IN_PROGRESS",
      warehouseId: wh1,
      assignmentId: asg1,
      inspectorId: inspId,
      scheduledAt: new Date().toISOString(),
      completedAt: null,
      findings: "Seal intact (Bolt Seal #CH-8829). Moisture indicators normal. Pallet strapping intact.",
      report: null,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: insp2,
      title: "Monthly Storage Condition & Racking Audit",
      type: "WAREHOUSE",
      status: "COMPLETED",
      warehouseId: wh1,
      assignmentId: null,
      inspectorId: inspId,
      scheduledAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      findings: "All aisle floor markings clearly visible. Fire extinguishers inspected & compliant. No upright beam deflection noted.",
      report: "Racking compliance 98.4%. One minor floor clearance issue in Bay 4 resolved on-site.",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: insp3,
      title: "High-Value Solar Equipment Quality Testing",
      type: "QUALITY",
      status: "SCHEDULED",
      warehouseId: wh3,
      assignmentId: null,
      inspectorId: inspId,
      scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      completedAt: null,
      findings: null,
      report: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const qualityInspectionRecords = [
    {
      id: "qual-0001-0000-0000-0000-000000000001",
      inspectionId: insp1,
      item: "Outer Carton Integrity & Corner Protectors",
      result: "pass",
      notes: "No crushing or moisture ingress detected on cartons.",
      severity: "low",
      inspectorId: inspId,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "qual-0002-0000-0000-0000-000000000002",
      inspectionId: insp1,
      item: "Barcode & Serial Tag Scannability",
      result: "pass",
      notes: "100% of tested serial labels scanned successfully via mobile terminal.",
      severity: "low",
      inspectorId: inspId,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const loadingUnloadingChecklists = [
    {
      id: "chk-0001-0000-0000-0000-000000000001",
      assignmentId: asg1,
      checklistType: "unloading",
      status: "in_progress",
      items: JSON.stringify([
        { item: "Driver ID & Vehicle RC Verified", checked: true },
        { item: "E-Way Bill & Invoice Match", checked: true },
        { item: "Security Bolt Seal Intact", checked: true },
        { item: "Cargo Lashings Removed Safely", checked: true },
        { item: "Forklift Safety Protocol Adherence", checked: true },
        { item: "All Pallets Staged in Inbound Quarantine", checked: false },
      ]),
      completedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  const podDocuments = [
    {
      id: "pod-0001-0000-0000-0000-000000000001",
      assignmentId: asg1,
      fileName: "POD_Consignment_48102.pdf",
      fileUrl: "/api/storage/sample-pod.pdf",
      mimeType: "application/pdf",
      size: 248900,
      status: "PENDING",
      extractedData: JSON.stringify({
        consignee: "Adani Solar Energy Rajasthan",
        deliveryDate: "2026-10-28",
        receiverSignature: "Present",
        packagesReceived: 42,
      }),
      verified: false,
      verifiedById: null,
      verifiedAt: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const tasks = [
    {
      id: "tsk-0001-0000-0000-0000-000000000001",
      title: "Reconcile Solar Inverter Shortage (4 Units)",
      description: "Review gate pass #GP-8831 and cross-reference with consignee acceptance voucher.",
      status: "open",
      priority: "high",
      assigneeId: opsId,
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      completedAt: null,
      assignmentId: asg1,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "tsk-0002-0000-0000-0000-000000000002",
      title: "Prepare Monthly Compliance Briefing",
      description: "Assemble inspection summaries, discrepancy closures, and 3PL turnaround times for executive review.",
      status: "in_progress",
      priority: "medium",
      assigneeId: adminId,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      completedAt: null,
      assignmentId: null,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const reports = [
    {
      id: "rep-0001-0000-0000-0000-000000000001",
      title: "Q3 2026 Warehouse Operations & Safety Audit Summary",
      type: "WAREHOUSE_INSPECTION_SUMMARY",
      status: "GENERATED",
      content: "Executive summary: Comprehensive audit completed across Bhiwandi, NCR, Bangalore, and Chennai facilities. Overall compliance 97.2%.",
      generatedById: opsId,
      fileUrl: null,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ];

  const notifications = [
    {
      id: "notif-0001-0000-0000-0000-000000000001",
      userId: opsId,
      type: "WARNING",
      title: "Cycle Count Discrepancy Flagged",
      content: "Stock Discrepancy #disc-0001 logged for Solar Hybrid Inverter 5kW (-4 units).",
      read: false,
      readAt: null,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: "notif-0002-0000-0000-0000-000000000002",
      userId: inspId,
      type: "INFO",
      title: "New Assignment Assigned",
      content: "You have been assigned to Inbound Dispatch Inspection at Bhiwandi Central.",
      read: true,
      readAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const documents = [
    {
      id: "doc-0001-0000-0000-0000-000000000001",
      originalName: "E-Way_Bill_392019284102.pdf",
      storedName: "eway-sample.pdf",
      fileUrl: "/api/storage/eway-sample.pdf",
      mimeType: "application/pdf",
      size: 154200,
      status: "COMPLETED",
      extractedData: JSON.stringify({
        ewayBillNo: "392019284102",
        validUpto: "2026-11-02",
        fromGSTIN: "27AAACB1234F1Z8",
        toGSTIN: "08BBBCB5678G2Z1",
      }),
      uploadedById: opsId,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const systemSettings = [
    {
      id: "set-0001-0000-0000-0000-000000000001",
      key: "ai_provider",
      value: "gemini",
      updatedById: adminId,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "set-0002-0000-0000-0000-000000000002",
      key: "ai_model",
      value: "gemini-1.5-flash-latest",
      updatedById: adminId,
      updatedAt: new Date().toISOString(),
    },
  ];

  // Multi-Tenancy Organizations & Members
  const org1Id = "org-apex-001";
  const org2Id = "org-horizon-002";

  const organizations = [
    {
      id: org1Id,
      name: "Apex Global Logistics",
      slug: "apex-logistics",
      domain: "apexlogistics.com",
      plan: "ENTERPRISE",
      isActive: true,
      logoUrl: "/icons/org-apex.svg",
      settings: JSON.stringify({ timezone: "Asia/Kolkata", dateFormat: "DD/MM/YYYY", currency: "INR" }),
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    },
    {
      id: org2Id,
      name: "Horizon Supply Chain Solutions",
      slug: "horizon-sc",
      domain: "horizonfreight.com",
      plan: "PROFESSIONAL",
      isActive: true,
      logoUrl: "/icons/org-horizon.svg",
      settings: JSON.stringify({ timezone: "UTC", dateFormat: "YYYY-MM-DD", currency: "USD" }),
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ];

  const organizationMembers = [
    { id: "mem-01", organizationId: org1Id, userId: adminId, role: "OWNER", createdAt: new Date().toISOString() },
    { id: "mem-02", organizationId: org2Id, userId: adminId, role: "ADMIN", createdAt: new Date().toISOString() },
    { id: "mem-03", organizationId: org1Id, userId: opsId, role: "MEMBER", createdAt: new Date().toISOString() },
    { id: "mem-04", organizationId: org1Id, userId: inspId, role: "MEMBER", createdAt: new Date().toISOString() },
    { id: "mem-05", organizationId: org1Id, userId: auditId, role: "VIEWER", createdAt: new Date().toISOString() },
    { id: "mem-06", organizationId: org1Id, userId: demoId, role: "VIEWER", createdAt: new Date().toISOString() },
  ];

  // Invoices & Billing
  const inv1Id = "inv-0001-0000-0000-0000-000000000001";
  const inv2Id = "inv-0002-0000-0000-0000-000000000002";
  const inv3Id = "inv-0003-0000-0000-0000-000000000003";

  const invoices = [
    {
      id: inv1Id,
      invoiceNumber: "INV-2026-001",
      organizationId: org1Id,
      clientName: "Metro Freight & Warehousing",
      clientEmail: "billing@metrofreight.com",
      assignmentId: assignments[0]?.id || "asg-0001",
      subtotal: 3600,
      tax: 648,
      total: 4248,
      currency: "USD",
      status: "PAID",
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      issuedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      paidAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      paymentMethod: "BANK_TRANSFER",
      notes: "Payment verified via transaction ref TXN-998231",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: inv2Id,
      invoiceNumber: "INV-2026-002",
      organizationId: org1Id,
      clientName: "TransNational Distribution Hub",
      clientEmail: "accounts@transnational.example",
      assignmentId: assignments[1]?.id || "asg-0002",
      subtotal: 2400,
      tax: 432,
      total: 2832,
      currency: "USD",
      status: "ISSUED",
      dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      issuedDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      paidAt: null,
      paymentMethod: null,
      notes: "Net 30 terms. Deliverables accepted.",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: inv3Id,
      invoiceNumber: "INV-2026-003",
      organizationId: org1Id,
      clientName: "SwiftLine Cargo Express",
      clientEmail: "finance@swiftlinecargo.example",
      assignmentId: null,
      subtotal: 1500,
      tax: 270,
      total: 1770,
      currency: "USD",
      status: "OVERDUE",
      dueDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      issuedDate: new Date(Date.now() - 86400000 * 21).toISOString(),
      paidAt: null,
      paymentMethod: null,
      notes: "First payment reminder issued.",
      createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ];

  const invoiceLineItems = [
    { id: "li-01", invoiceId: inv1Id, description: "Full Warehouse Quality Audit & Safety Inspection", quantity: 1, unitPrice: 2400, amount: 2400 },
    { id: "li-02", invoiceId: inv1Id, description: "Digital POD Verification & Reconciliation", quantity: 4, unitPrice: 300, amount: 1200 },
    { id: "li-03", invoiceId: inv2Id, description: "Cross-dock Loading Verification (Per Shift)", quantity: 2, unitPrice: 1200, amount: 2400 },
    { id: "li-04", invoiceId: inv3Id, description: "Cold Chain Sensor Recalibration & Audit", quantity: 1, unitPrice: 1500, amount: 1500 },
  ];

  // Vendors
  const vendors = [
    {
      id: "ven-0001",
      organizationId: org1Id,
      name: "SafeHaul Cold Chain Transport",
      code: "VND-SH-01",
      contactName: "Prakash Varma",
      email: "dispatch@safehaul.example",
      phone: "+91 98450 11990",
      address: "Plot 14, MIDC Industrial Area, Pune",
      category: "Fleet & Refrigerated Transport",
      rating: 4.8,
      complianceStatus: "COMPLIANT",
      contractExpiry: new Date(Date.now() + 86400000 * 180).toISOString(),
      notes: "ISO 9001 and GDP certified. Temperature monitoring sensors verified.",
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    },
    {
      id: "ven-0002",
      organizationId: org1Id,
      name: "Apex Security & Gate Solutions",
      code: "VND-SEC-02",
      contactName: "Vikram Nair",
      email: "operations@apexsec.example",
      phone: "+91 99123 44556",
      address: "Sector 18, Gurugram, Haryana",
      category: "Warehouse Security & Access",
      rating: 4.6,
      complianceStatus: "COMPLIANT",
      contractExpiry: new Date(Date.now() + 86400000 * 90).toISOString(),
      notes: "Gate security and CCTV log audit current.",
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: "ven-0003",
      organizationId: org1Id,
      name: "SwiftPack Pallet & Packaging",
      code: "VND-SW-03",
      contactName: "Ramesh Dave",
      email: "orders@swiftpack.example",
      phone: "+91 98777 66221",
      address: "Warehouse Complex 3, Bhiwandi",
      category: "Packaging & Crates",
      rating: 3.9,
      complianceStatus: "PENDING_REVIEW",
      contractExpiry: new Date(Date.now() + 86400000 * 20).toISOString(),
      notes: "Pending updated pest-treatment phytosanitary certificate.",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
  ];

  // Quality CAPA Records & Actions
  const capa1Id = "capa-0001";
  const capa2Id = "capa-0002";

  const capaRecords = [
    {
      id: capa1Id,
      organizationId: org1Id,
      capaNumber: "CAPA-2026-001",
      title: "Temperature excursion in Bay 4 Cold Storage",
      source: "INSPECTION",
      severity: "HIGH",
      status: "IN_PROGRESS",
      ownerId: opsId,
      rootCauseMethod: "5_WHYS",
      rootCauseAnalysis: "1. Why did temp rise? Compressor relay tripped. 2. Why? Power surge. 3. Why surge? Unshielded breaker. 4. Why unshielded? Outdated maintenance cycle. 5. Root cause: Preventative inspection schedule omitted aux surge suppressors.",
      containmentAction: "Immediate relocation of sensitive vaccines to Cold Bay 2. Auxiliary generator linked.",
      targetDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      closedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: capa2Id,
      organizationId: org1Id,
      capaNumber: "CAPA-2026-002",
      title: "Missing seal verification on container CN-9941",
      source: "DISCREPANCY",
      severity: "MEDIUM",
      status: "VERIFIED",
      ownerId: inspId,
      rootCauseMethod: "FISHBONE",
      rootCauseAnalysis: "Operator rush during shift change led to skipping second verification checklist item.",
      containmentAction: "Container quarantined, secondary inspection completed, new tamper-evident seal applied.",
      targetDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      closedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const capaActions = [
    {
      id: "act-01",
      capaRecordId: capa1Id,
      description: "Install industrial surge protection on Bay 4 compressors",
      type: "CORRECTIVE",
      assigneeId: opsId,
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: "COMPLETED",
      notes: "Electrician certified surge suppressor installed on 07 Nov.",
      completedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "act-02",
      capaRecordId: capa1Id,
      description: "Update monthly HVAC preventive maintenance checklist SOP",
      type: "PREVENTIVE",
      assigneeId: opsId,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: "PENDING",
      notes: "Drafted, pending management signoff.",
      completedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "act-03",
      capaRecordId: capa2Id,
      description: "Implement barcode scan requirement before gate-out dispatch",
      type: "PREVENTIVE",
      assigneeId: inspId,
      dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "COMPLETED",
      notes: "Scanners configured to require double-scan on seals.",
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  // Tag existing entities with org1Id
  const taggedWarehouses = warehouses.map((w) => ({ ...w, organizationId: org1Id }));
  const taggedAssignments = assignments.map((a) => ({ ...a, organizationId: org1Id }));
  const taggedInspections = inspections.map((i) => ({ ...i, organizationId: org1Id }));
  const taggedDocuments = documents.map((d) => ({ ...d, organizationId: org1Id }));
  const taggedReports = reports.map((r) => ({ ...r, organizationId: org1Id }));

  return {
    users,
    warehouses: taggedWarehouses,
    inventoryItems,
    stockDiscrepancies,
    inspections: taggedInspections,
    qualityInspectionRecords,
    loadingUnloadingChecklists,
    podDocuments,
    tasks,
    reports: taggedReports,
    notifications,
    aiConversations: [],
    aiMessages: [],
    documents: taggedDocuments,
    auditLogs: [],
    systemSettings,
    assignments: taggedAssignments,
    organizations,
    organizationMembers,
    invoices,
    invoiceLineItems,
    vendors,
    capaRecords,
    capaActions,
    passwordResetTokens: [],
    shipments: [],
  };
}

class LocalDatabase {
  private data: LocalStoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): LocalStoreData {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const seed = getInitialSeedData();
        return {
          ...seed,
          ...parsed,
          organizations: parsed.organizations && parsed.organizations.length > 0 ? parsed.organizations : seed.organizations,
          organizationMembers: parsed.organizationMembers && parsed.organizationMembers.length > 0 ? parsed.organizationMembers : seed.organizationMembers,
          invoices: parsed.invoices && parsed.invoices.length > 0 ? parsed.invoices : seed.invoices,
          invoiceLineItems: parsed.invoiceLineItems && parsed.invoiceLineItems.length > 0 ? parsed.invoiceLineItems : seed.invoiceLineItems,
          vendors: parsed.vendors && parsed.vendors.length > 0 ? parsed.vendors : seed.vendors,
          capaRecords: parsed.capaRecords && parsed.capaRecords.length > 0 ? parsed.capaRecords : seed.capaRecords,
          capaActions: parsed.capaActions && parsed.capaActions.length > 0 ? parsed.capaActions : seed.capaActions,
          passwordResetTokens: parsed.passwordResetTokens || [],
          shipments: parsed.shipments || [],
        };
      }
    } catch {
      // Fallback to fresh seed
    }
    const seed = getInitialSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(dataToSave = this.data) {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      const tmpPath = path.join(STORAGE_DIR, `data.${process.pid}.${Date.now()}.tmp`);
      fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tmpPath, DATA_FILE);
    } catch {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
      } catch {
        // Persistence error handled gracefully
      }
    }
  }

  // Repository Builder helper
  private createRepo<T extends { id: string }>(
    getCollection: () => T[],
    populateRelations?: (item: T, include?: any) => Promise<T> | T
  ) {
    const self = this;

    const toTime = (v: any): number | null => {
      if (v === null || v === undefined) return null;
      if (v instanceof Date) return v.getTime();
      const t = Date.parse(v);
      return Number.isNaN(t) ? null : t;
    };

    const resolveRelation = (item: any, key: string): any => {
      if (item && item[key] !== undefined) return item[key];
      // Fall back to in-memory relations for local db
      const data = self.data as any;
      switch (key) {
        case "inventoryItem":
          return data.inventoryItems?.find((x: any) => x.id === item.inventoryItemId) ?? null;
        case "warehouse":
          return data.warehouses?.find((x: any) => x.id === item.warehouseId) ?? null;
        case "assignment":
          return data.assignments?.find((x: any) => x.id === item.assignmentId) ?? null;
        case "inspector":
          return data.users?.find((x: any) => x.id === item.inspectorId) ?? null;
        case "reporter":
          return data.users?.find((x: any) => x.id === item.reportedById) ?? null;
        case "resolver":
          return data.users?.find((x: any) => x.id === item.resolvedById) ?? null;
        case "verifier":
          return data.users?.find((x: any) => x.id === item.verifiedById) ?? null;
        case "assignee":
          return data.users?.find((x: any) => x.id === item.assigneeId) ?? null;
        case "uploadedBy":
          return data.users?.find((x: any) => x.id === item.uploadedById) ?? null;
        case "generatedBy":
          return data.users?.find((x: any) => x.id === item.generatedById) ?? null;
        case "qualityRecords":
          return data.qualityInspectionRecords?.filter((x: any) => x.inspectionId === item.id) ?? [];
        case "messages":
          return data.aiMessages?.filter((x: any) => x.conversationId === item.id) ?? [];
        case "organization":
          return data.organizations?.find((x: any) => x.id === (item.organizationId || item.id)) ?? null;
        case "members":
          return data.organizationMembers?.filter((x: any) => x.organizationId === item.id) ?? [];
        case "lineItems":
          return data.invoiceLineItems?.filter((x: any) => x.invoiceId === item.id) ?? [];
        case "actions":
          return data.capaActions?.filter((x: any) => x.capaRecordId === item.id) ?? [];
        case "owner":
          return data.users?.find((x: any) => x.id === item.ownerId) ?? null;
        case "user":
          return data.users?.find((x: any) => x.id === item.userId) ?? null;
        default:
          return undefined;
      }
    };

    const matchesWhere = (item: any, where: any): boolean => {
      if (!where) return true;
      if (Array.isArray(where)) {
        // implicit AND array form (not standard Prisma but safe)
        return where.every((w) => matchesWhere(item, w));
      }
      return Object.entries(where).every(([key, val]) => {
        if (val === undefined) return true;

        // Logical combinators
        if (key === "AND") {
          return Array.isArray(val) ? val.every((w) => matchesWhere(item, w)) : matchesWhere(item, val);
        }
        if (key === "OR") {
          return Array.isArray(val) ? val.some((w) => matchesWhere(item, w)) : matchesWhere(item, val);
        }
        if (key === "NOT") {
          return !matchesWhere(item, val);
        }

        const itemVal = resolveRelation(item, key);

        // Operator object
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          const v = val as any;

          // Relation filters
          if ("some" in v || "every" in v || "none" in v) {
            const arr = Array.isArray(itemVal) ? itemVal : [];
            if ("some" in v) return arr.some((x: any) => matchesWhere(x, v.some));
            if ("every" in v) return arr.every((x: any) => matchesWhere(x, v.every));
            if ("none" in v) return !arr.some((x: any) => matchesWhere(x, v.none));
          }

          // Field operators
          if ("equals" in v) return itemVal === v.equals;
          if ("not" in v) return itemVal !== v.not;
          if ("in" in v) return Array.isArray(v.in) && v.in.includes(itemVal);
          if ("notIn" in v) return !Array.isArray(v.notIn) || !v.notIn.includes(itemVal);

          const itemTime = toTime(itemVal);
          const valTime = (k: string) => toTime(v[k]);
          if ("lt" in v) {
            const vt = valTime("lt");
            if (vt !== null && itemTime !== null) return itemTime < vt;
            return itemVal < v.lt;
          }
          if ("lte" in v) {
            const vt = valTime("lte");
            if (vt !== null && itemTime !== null) return itemTime <= vt;
            return itemVal <= v.lte;
          }
          if ("gt" in v) {
            const vt = valTime("gt");
            if (vt !== null && itemTime !== null) return itemTime > vt;
            return itemVal > v.gt;
          }
          if ("gte" in v) {
            const vt = valTime("gte");
            if (vt !== null && itemTime !== null) return itemTime >= vt;
            return itemVal >= v.gte;
          }
          if ("contains" in v) {
            return String(itemVal ?? "").toLowerCase().includes(String(v.contains).toLowerCase());
          }
          if ("startsWith" in v) {
            return String(itemVal ?? "").toLowerCase().startsWith(String(v.startsWith).toLowerCase());
          }
          if ("endsWith" in v) {
            return String(itemVal ?? "").toLowerCase().endsWith(String(v.endsWith).toLowerCase());
          }

          // Nested object relation
          const related = itemVal ?? resolveRelation(item, key);
          if (related && typeof related === "object") {
            return matchesWhere(related, v);
          }
          return false;
        }

        // Primitive equality (with date normalization)
        const it = toTime(itemVal);
        const vt = toTime(val);
        if (it !== null && vt !== null) return it === vt;
        return itemVal === val;
      });
    };

    return {
      findMany: async (args: any = {}): Promise<T[]> => {
        let items = [...getCollection()];

        // Filter where
        if (args.where) {
          items = items.filter((item: any) => matchesWhere(item, args.where));
        }

        // Order by
        if (args.orderBy) {
          const [orderKey, orderDir] = Object.entries(args.orderBy)[0] as [string, "asc" | "desc"];
          items.sort((a: any, b: any) => {
            const valA = a[orderKey];
            const valB = b[orderKey];
            if (valA === valB) return 0;
            if (orderDir === "desc") return valA < valB ? 1 : -1;
            return valA > valB ? 1 : -1;
          });
        }

        // Take
        if (typeof args.take === "number") {
          items = items.slice(0, args.take);
        }

        // Relations
        if (args.include && populateRelations) {
          return Promise.all(items.map((i) => populateRelations(i, args.include)));
        }
        return items;
      },

      findUnique: async (args: { where: any; include?: any }): Promise<T | null> => {
        const items = getCollection();
        const found = items.find((item: any) => matchesWhere(item, args.where));
        if (!found) return null;
        if (args.include && populateRelations) {
          return populateRelations(found, args.include);
        }
        return found;
      },

      findFirst: async (args: any = {}): Promise<T | null> => {
        const results = await this.createRepo(getCollection, populateRelations).findMany({
          ...args,
          take: 1,
        });
        return results[0] || null;
      },

      count: async (args: any = {}): Promise<number> => {
        const results = await this.createRepo(getCollection, populateRelations).findMany(args);
        return results.length;
      },

      create: async (args: { data: any; include?: any; select?: any }): Promise<T> => {
        const collection = getCollection();
        const newItem: any = {
          id: args.data.id || generateUuid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...args.data,
        };
        collection.unshift(newItem);
        this.persist();
        if (args.include && populateRelations) {
          return populateRelations(newItem, args.include);
        }
        return newItem;
      },

      update: async (args: { where: any; data: any; include?: any }): Promise<T> => {
        const collection = getCollection();
        const index = collection.findIndex((item: any) => matchesWhere(item, args.where));
        if (index === -1) {
          throw new Error("Record not found to update");
        }
        const updated = {
          ...collection[index],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        collection[index] = updated;
        this.persist();
        if (args.include && populateRelations) {
          return populateRelations(updated, args.include);
        }
        return updated;
      },

      updateMany: async (args: { where: any; data: any }): Promise<{ count: number }> => {
        const collection = getCollection();
        let count = 0;
        collection.forEach((item: any, idx) => {
          const match = matchesWhere(item, args.where);
          if (match) {
            collection[idx] = { ...item, ...args.data, updatedAt: new Date().toISOString() };
            count++;
          }
        });
        if (count > 0) this.persist();
        return { count };
      },

      delete: async (args: { where: any }): Promise<T> => {
        const collection = getCollection();
        const index = collection.findIndex((item: any) => matchesWhere(item, args.where));
        if (index === -1) {
          throw new Error("Record not found to delete");
        }
        const [deleted] = collection.splice(index, 1);
        this.persist();
        return deleted;
      },

      upsert: async (args: { where: any; update: any; create: any; include?: any }): Promise<T> => {
        const collection = getCollection();
        const existing = collection.find((item: any) => matchesWhere(item, args.where));
        if (existing) {
          return this.createRepo(getCollection, populateRelations).update({
            where: args.where,
            data: args.update,
            include: args.include,
          });
        }
        return this.createRepo(getCollection, populateRelations).create({
          data: args.create,
          include: args.include,
        });
      },
    };
  }

  // Exposed repositories matching Prisma schema models
  public user = this.createRepo(
    () => this.data.users,
    (user) => user
  );

  public warehouse = this.createRepo(() => this.data.warehouses);

  public inventoryItem = this.createRepo(
    () => this.data.inventoryItems,
    (item, inc) => {
      const res: any = { ...item };
      if (inc?.warehouse) {
        res.warehouse = this.data.warehouses.find((w) => w.id === item.warehouseId) || null;
      }
      return res;
    }
  );

  public stockDiscrepancy = this.createRepo(
    () => this.data.stockDiscrepancies,
    (disc, inc) => {
      const res: any = { ...disc };
      if (inc?.inventoryItem) {
        const inv = this.data.inventoryItems.find((i) => i.id === disc.inventoryItemId);
        res.inventoryItem = inv ? { ...inv } : null;
        if (res.inventoryItem && inc?.inventoryItem?.include?.warehouse) {
          res.inventoryItem.warehouse =
            this.data.warehouses.find((w) => w.id === res.inventoryItem.warehouseId) || null;
        }
      }
      if (inc?.reporter) {
        res.reporter = this.data.users.find((u) => u.id === disc.reportedById) || null;
      }
      if (inc?.resolver) {
        res.resolver = this.data.users.find((u) => u.id === disc.resolvedById) || null;
      }
      return res;
    }
  );

  public assignment = this.createRepo(
    () => this.data.assignments,
    (asg, inc) => {
      const res: any = { ...asg };
      if (inc?.assignee) {
        res.assignee = this.data.users.find((u) => u.id === asg.assigneeId) || null;
      }
      if (inc?.creator) {
        res.creator = this.data.users.find((u) => u.id === asg.creatorId) || null;
      }
      if (inc?.inspections) {
        res.inspections = this.data.inspections.filter((i) => i.assignmentId === asg.id);
      }
      if (inc?.tasks) {
        res.tasks = this.data.tasks.filter((t) => t.assignmentId === asg.id);
      }
      return res;
    }
  );

  public shipment = this.createRepo(
    () => this.data.shipments,
    (shipment, inc) => {
      const res: any = { ...shipment };
      if (inc?.assignment) {
        res.assignment = this.data.assignments.find((item) => item.id === shipment.assignmentId) || null;
      }
      if (inc?.inventoryItem) {
        const item = this.data.inventoryItems.find((entry) => entry.id === shipment.inventoryItemId);
        res.inventoryItem = item ? { ...item } : null;
        if (res.inventoryItem && inc.inventoryItem.include?.warehouse) {
          res.inventoryItem.warehouse =
            this.data.warehouses.find((warehouse) => warehouse.id === res.inventoryItem.warehouseId) || null;
        }
      }
      return res;
    }
  );

  public inspection = this.createRepo(
    () => this.data.inspections,
    (insp, inc) => {
      const res: any = { ...insp };
      if (inc?.warehouse) {
        res.warehouse = this.data.warehouses.find((w) => w.id === insp.warehouseId) || null;
      }
      if (inc?.assignment) {
        res.assignment = this.data.assignments.find((a) => a.id === insp.assignmentId) || null;
      }
      if (inc?.inspector) {
        res.inspector = this.data.users.find((u) => u.id === insp.inspectorId) || null;
      }
      if (inc?.qualityRecords) {
        res.qualityRecords = this.data.qualityInspectionRecords.filter(
          (q) => q.inspectionId === insp.id
        );
      }
      return res;
    }
  );

  public qualityInspectionRecord = this.createRepo(
    () => this.data.qualityInspectionRecords,
    (rec, inc) => {
      const res: any = { ...rec };
      if (inc?.inspector) {
        res.inspector = this.data.users.find((u) => u.id === rec.inspectorId) || null;
      }
      return res;
    }
  );

  public loadingUnloadingChecklist = this.createRepo(
    () => this.data.loadingUnloadingChecklists,
    (chk, inc) => {
      const res: any = { ...chk };
      if (inc?.assignment) {
        res.assignment = this.data.assignments.find((a) => a.id === chk.assignmentId) || null;
      }
      return res;
    }
  );

  public pODDocument = this.createRepo(
    () => this.data.podDocuments,
    (pod, inc) => {
      const res: any = { ...pod };
      if (inc?.assignment) {
        res.assignment = this.data.assignments.find((a) => a.id === pod.assignmentId) || null;
      }
      if (inc?.verifier) {
        res.verifier = this.data.users.find((u) => u.id === pod.verifiedById) || null;
      }
      return res;
    }
  );

  public task = this.createRepo(
    () => this.data.tasks,
    (tsk, inc) => {
      const res: any = { ...tsk };
      if (inc?.assignee) {
        res.assignee = this.data.users.find((u) => u.id === tsk.assigneeId) || null;
      }
      if (inc?.assignment) {
        res.assignment = this.data.assignments.find((a) => a.id === tsk.assignmentId) || null;
      }
      return res;
    }
  );

  public report = this.createRepo(
    () => this.data.reports,
    (rep, inc) => {
      const res: any = { ...rep };
      if (inc?.generatedBy) {
        res.generatedBy = this.data.users.find((u) => u.id === rep.generatedById) || null;
      }
      return res;
    }
  );

  public notification = this.createRepo(
    () => this.data.notifications,
    (notif, inc) => {
      const res: any = { ...notif };
      if (inc?.user) {
        res.user = this.data.users.find((u) => u.id === notif.userId) || null;
      }
      return res;
    }
  );

  public aiConversation = this.createRepo(
    () => this.data.aiConversations,
    (conv, inc) => {
      const res: any = { ...conv };
      if (inc?.messages) {
        res.messages = this.data.aiMessages.filter((m) => m.conversationId === conv.id);
      }
      return res;
    }
  );

  public aiMessage = this.createRepo(() => this.data.aiMessages);

  public document = this.createRepo(
    () => this.data.documents,
    (doc, inc) => {
      const res: any = { ...doc };
      if (inc?.uploadedBy) {
        res.uploadedBy = this.data.users.find((u) => u.id === doc.uploadedById) || null;
      }
      return res;
    }
  );

  public auditLog = this.createRepo(() => this.data.auditLogs);

  public systemSetting = this.createRepo(() => this.data.systemSettings);

  public organization = this.createRepo(
    () => this.data.organizations,
    (org, inc) => {
      const res: any = { ...org };
      if (inc?.members) {
        res.members = this.data.organizationMembers.filter((m) => m.organizationId === org.id);
      }
      return res;
    }
  );

  public organizationMember = this.createRepo(
    () => this.data.organizationMembers,
    (m, inc) => {
      const res: any = { ...m };
      if (inc?.user) {
        res.user = this.data.users.find((u) => u.id === m.userId) || null;
      }
      if (inc?.organization) {
        res.organization = this.data.organizations.find((o) => o.id === m.organizationId) || null;
      }
      return res;
    }
  );

  public invoice = this.createRepo(
    () => this.data.invoices,
    (inv, inc) => {
      const res: any = { ...inv };
      if (inc?.lineItems) {
        res.lineItems = this.data.invoiceLineItems.filter((li) => li.invoiceId === inv.id);
      }
      if (inc?.assignment) {
        res.assignment = this.data.assignments.find((a) => a.id === inv.assignmentId) || null;
      }
      if (inc?.organization) {
        res.organization = this.data.organizations.find((o) => o.id === inv.organizationId) || null;
      }
      return res;
    }
  );

  public invoiceLineItem = this.createRepo(() => this.data.invoiceLineItems);

  public vendor = this.createRepo(() => this.data.vendors);

  public capaRecord = this.createRepo(
    () => this.data.capaRecords,
    (rec, inc) => {
      const res: any = { ...rec };
      if (inc?.actions) {
        res.actions = this.data.capaActions.filter((a) => a.capaRecordId === rec.id);
      }
      if (inc?.owner) {
        res.owner = this.data.users.find((u) => u.id === rec.ownerId) || null;
      }
      return res;
    }
  );

  public capaAction = this.createRepo(
    () => this.data.capaActions,
    (act, inc) => {
      const res: any = { ...act };
      if (inc?.assignee) {
        res.assignee = this.data.users.find((u) => u.id === act.assigneeId) || null;
      }
      return res;
    }
  );

  public passwordResetToken = this.createRepo(() => this.data.passwordResetTokens);

  public getRawData(): LocalStoreData {
    return JSON.parse(JSON.stringify(this.data));
  }

  public restoreData(newData: LocalStoreData): void {
    const seed = getInitialSeedData();
    this.data = {
      ...seed,
      ...newData,
      organizations: newData.organizations || seed.organizations,
      organizationMembers: newData.organizationMembers || seed.organizationMembers,
      invoices: newData.invoices || seed.invoices,
      invoiceLineItems: newData.invoiceLineItems || seed.invoiceLineItems,
      vendors: newData.vendors || seed.vendors,
      capaRecords: newData.capaRecords || seed.capaRecords,
      capaActions: newData.capaActions || seed.capaActions,
      passwordResetTokens: newData.passwordResetTokens || [],
    };
    this.persist(this.data);
  }

  public resetToSeed(): void {
    this.data = getInitialSeedData();
    this.persist(this.data);
  }

  public async $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return fn(this);
  }

  public async $queryRaw() {
    return [{ 1: 1 }];
  }
}

export const localDb = new LocalDatabase();
