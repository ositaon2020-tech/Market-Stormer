import { jsPDF } from 'jspdf';
import { Vendor, Complaint, WeeklyVisit } from '../types';

// Palette Colors
const PRIMARY_RGB = { r: 36, g: 79, b: 59 }; // #244F3B - Deep Green
const SECONDARY_RGB = { r: 244, g: 156, b: 74 }; // #f49c4a - Amber Orange
const TEXT_DARK_RGB = { r: 30, g: 41, b: 59 }; // Slate-800
const TEXT_MUTED_RGB = { r: 100, g: 116, b: 139 }; // Slate-500
const LINE_GRAY_RGB = { r: 226, g: 232, b: 240 }; // Gray-200
const BG_LIGHT_RGB = { r: 240, g: 246, b: 243 }; // Soft light green-gray tint

function drawHeaderBanner(doc: jsPDF, titleText: string, subTitleText: string) {
  // Brand Header block
  doc.setFillColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.rect(0, 0, 210, 36, 'F');

  // Orange bottom accent border for the header
  doc.setFillColor(SECONDARY_RGB.r, SECONDARY_RGB.g, SECONDARY_RGB.b);
  doc.rect(0, 36, 210, 2.5, 'F');

  // Company Watermark text or visual identifier
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('MARKET', 14, 21);
  
  // Custom Orange Dot indicator
  doc.setFillColor(SECONDARY_RGB.r, SECONDARY_RGB.g, SECONDARY_RGB.b);
  doc.circle(41, 18, 1.5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.text('STORMER', 45, 21);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY_RGB.r, SECONDARY_RGB.g, SECONDARY_RGB.b);
  doc.text('ONBOARDING LEDGER APPARATUS', 14, 30);

  // Document Title (Right-aligned)
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(titleText, 210 - 14, 18, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(225, 230, 227);
  doc.text(subTitleText, 210 - 14, 26, { align: 'right' });
}

function drawFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = 297;
  
  // Subtle top border line
  doc.setDrawColor(LINE_GRAY_RGB.r, LINE_GRAY_RGB.g, LINE_GRAY_RGB.b);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 16, 210 - 14, pageHeight - 16);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
  doc.text('Market Stormer Nigeria • Secure Verification Apparatus Sync Report v2.4', 14, pageHeight - 10);
  
  doc.text(`Page ${pageNum}`, 210 - 14, pageHeight - 10, { align: 'right' });
}

export function exportVendorWeeklyReport(
  vendor: Vendor,
  complaints: Complaint[],
  visits: WeeklyVisit[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const timestamp = new Date().toLocaleString();
  drawHeaderBanner(doc, 'INDIVIDUAL MERCHANT AUDIT', `Sync: ${timestamp}`);

  let y = 52;

  // 1. Merchant Metadata Card
  doc.setFillColor(BG_LIGHT_RGB.r, BG_LIGHT_RGB.g, BG_LIGHT_RGB.b);
  doc.rect(14, y, 182, 38, 'F');
  doc.setDrawColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.setLineWidth(0.5);
  doc.rect(14, y, 182, 38, 'S');

  // Title inside card
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text(`MERCHANT CORE METADATA: ${vendor.name.toUpperCase()}`, 19, y + 7);

  // Details
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);

  doc.text(`Owner / Operator: ${vendor.ownerName}`, 19, y + 16);
  doc.text(`Contact Phone: ${vendor.phone}`, 19, y + 23);
  doc.text(`Registered Date: ${vendor.registeredDate}`, 19, y + 30);

  doc.text(`Hub/Region: ${vendor.hubRegion} (${vendor.city})`, 110, y + 16);
  doc.text(`Category / Specialty: ${vendor.category}`, 110, y + 23);
  const qualityText = vendor.qualityStatus === 'approved' ? 'APPROVED' : vendor.qualityStatus === 'pending' ? 'PENDING QA' : 'ACTION REQUIRED';
  doc.text(`Quality Approval: ${qualityText}`, 110, y + 30);

  y += 48;

  // 2. Onboarding Milestones Checklist Progress
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text('ONBOARDING MILESTONE TRACKER', 14, y);
  
  // Progress bar
  const prc = (vendor.onboardingStep / 6) * 100;
  doc.setFillColor(220, 225, 222);
  doc.rect(14, y + 4, 182, 6, 'F');
  doc.setFillColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.rect(14, y + 4, 182 * (vendor.onboardingStep / 6), 6, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text(`Current Sync State: Step ${vendor.onboardingStep}/6 (${Math.round(prc)}% Complete)`, 14, y + 15);

  y += 24;

  // Checklist Details
  const checklistItems = [
    { label: 'Level 1: System Registry Registered', value: vendor.checklist.registered },
    { label: 'Level 2: Profile & Details Completed', value: vendor.checklist.profileCompleted },
    { label: 'Level 3: Core Initial Product Uploaded', value: vendor.checklist.firstProductUploaded },
    { label: 'Level 4: Catalyst Catalogue Uploaded (10+ Prods)', value: vendor.checklist.min10ProductsUploaded },
    { label: 'Level 5: Initial Consumer Order Received', value: vendor.checklist.firstOrderReceived },
    { label: 'Level 6: End-to-End Onboarding Fulfilled', value: vendor.checklist.firstOrderFulfilled }
  ];

  checklistItems.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    const itemY = y + (idx * 8);
    
    // Draw tiny light gray background for Alternating rows
    if (isEven) {
      doc.setFillColor(248, 250, 249);
      doc.rect(14, itemY - 5, 182, 8, 'F');
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);
    doc.text(item.label, 19, itemY);

    if (item.value) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(36, 120, 70); // Green
      doc.text('COMPLETED', 160, itemY);
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(180, 50, 50); // Muted red
      doc.text('ON STANDBY', 160, itemY);
    }
  });

  y += 56;

  // 3. Product Listings and Catalogs
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text('CATALOGUE PRODUCT METRICS', 14, y);
  
  doc.setDrawColor(LINE_GRAY_RGB.r, LINE_GRAY_RGB.g, LINE_GRAY_RGB.b);
  doc.setLineWidth(0.3);
  doc.line(14, y + 2, 196, y + 2);

  const totalProds = vendor.products?.length || 0;
  const approvedProds = vendor.products?.filter(p => p.status === 'approved').length || 0;
  const pendingProds = vendor.products?.filter(p => p.status === 'pending_review').length || 0;
  const rejectedProds = vendor.products?.filter(p => p.status === 'rejected').length || 0;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);
  doc.text(`Total SKU Inventory: ${totalProds}`, 16, y + 8);
  doc.text(`Fully Approved: ${approvedProds}`, 62, y + 8);
  doc.text(`Pending Audit: ${pendingProds}`, 110, y + 8);
  doc.text(`Action Required: ${rejectedProds}`, 155, y + 8);

  y += 20;

  // 4. Visits and Grievances
  const vendorVisits = visits.filter(v => v.vendorId === vendor.id);
  const vendorComplaints = complaints.filter(c => c.vendorId === vendor.id);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text(`CRITICAL LOGS & ISSUES (Total Visits: ${vendorVisits.length} | Tickets: ${vendorComplaints.length})`, 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  // Show last visit
  if (vendorVisits.length > 0) {
    const lastVisit = vendorVisits[0];
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);
    doc.text(`Last Field Visit: ${lastVisit.date} by ${lastVisit.supervisorName}`, 16, y);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Notes: ${lastVisit.notes.substring(0, 105)}...`, 16, y + 5);
    y += 12;
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
    doc.text('No physical field visitation logged in current tracking cycle.', 16, y);
    y += 8;
  }

  // Show active complaints
  if (vendorComplaints.length > 0) {
    const activeComp = vendorComplaints[0];
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 50, 50);
    doc.text(`Active Complaint: ${activeComp.title} (${activeComp.severity.toUpperCase()} SEVERITY)`, 16, y);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);
    doc.text(`Description: ${activeComp.description.substring(0, 105)}...`, 16, y + 5);
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
    doc.text('Merchant carries positive health standing. Zero grievance reports open.', 16, y);
  }

  // 5. Signature Space
  y = 250;
  doc.setDrawColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
  doc.setLineWidth(0.5);
  doc.line(14, y, 74, y);
  doc.line(136, y, 196, y);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
  doc.text('Market Stormer Supervisor Signature', 14, y + 5);
  doc.text('Government/Hub Executive Sign-off', 136, y + 5);

  drawFooter(doc, 1);

  // Save/Download PDF named specifically by merchant
  doc.save(`MARKET_STORMER_REPORT_${vendor.name.replace(/\s+/g, '_')}.pdf`);
  return true;
}

export function exportRegionWeeklyReport(
  regionName: string,
  regionVendors: Vendor[],
  complaints: Complaint[],
  visits: WeeklyVisit[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const timestamp = new Date().toLocaleString();
  drawHeaderBanner(doc, 'REGIONAL HUB COMMAND LEDGER', `Region: ${regionName}`);

  let y = 50;

  // Compute stats
  const totalVendors = regionVendors.length;
  const completions = regionVendors.filter(v => v.onboardingStep === 6).length;
  const totalSteps = regionVendors.reduce((sum, v) => sum + v.onboardingStep, 0);
  const avgStep = totalVendors > 0 ? (totalSteps / totalVendors).toFixed(1) : '0.0';
  const completeRate = totalVendors > 0 ? Math.round((completions / totalVendors) * 100) : 0;

  const totalComplaintsInHub = complaints.filter(c => regionVendors.some(v => v.id === c.vendorId)).length;
  const activeComplaintsInHub = complaints.filter(c => c.status !== 'resolved' && regionVendors.some(v => v.id === c.vendorId)).length;

  // 1. Executive Summary Box
  doc.setFillColor(BG_LIGHT_RGB.r, BG_LIGHT_RGB.g, BG_LIGHT_RGB.b);
  doc.rect(14, y, 182, 38, 'F');
  doc.setDrawColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.setLineWidth(0.5);
  doc.rect(14, y, 182, 38, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text(`REGIONAL EXECUTIVE PERFORMANCE INDEX: ${regionName.toUpperCase()}`, 19, y + 7);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);

  doc.text(`Total Tracked Merchants: ${totalVendors}`, 19, y + 16);
  doc.text(`Fully Onboarded (Step 6): ${completions} of ${totalVendors}`, 19, y + 23);
  doc.text(`Hub Progress Rate: ${completeRate}% Completed`, 19, y + 30);

  doc.text(`Weighted Performance Avg: ${avgStep}/6.0 Steps`, 110, y + 16);
  doc.text(`Total Grievances Registered: ${totalComplaintsInHub}`, 110, y + 23);
  doc.text(`Urgent/Open Tickets: ${activeComplaintsInHub} Pending`, 110, y + 30);

  y += 48;

  // 2. Performance Grid table
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.text('MERCHANT FLEET DIRECTORY & STATUS', 14, y);
  
  doc.setDrawColor(LINE_GRAY_RGB.r, LINE_GRAY_RGB.g, LINE_GRAY_RGB.b);
  doc.setLineWidth(0.3);
  doc.line(14, y + 2, 196, y + 2);

  y += 10;

  // Table Headers
  doc.setFillColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.rect(14, y - 5, 182, 7.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Brand / Shop Name', 18, y);
  doc.text('Owner Name', 70, y);
  doc.text('Hub City', 110, y);
  doc.text('Onb. Step', 145, y);
  doc.text('Products', 165, y);
  doc.text('Status', 182, y);

  y += 7;

  // Row listing of vendors in the region (Limit to first 12 for professional A4 layout bounds)
  const listLimitVendors = regionVendors.slice(0, 16);

  listLimitVendors.forEach((v, idx) => {
    const isEven = idx % 2 === 0;
    
    if (isEven) {
      doc.setFillColor(BG_LIGHT_RGB.r, BG_LIGHT_RGB.g, BG_LIGHT_RGB.b);
      doc.rect(14, y - 5, 182, 7, 'F');
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_DARK_RGB.r, TEXT_DARK_RGB.g, TEXT_DARK_RGB.b);

    doc.text(v.name.substring(0, 24), 18, y);
    doc.text(v.ownerName.substring(0, 18), 70, y);
    doc.text(v.city || 'Lagos', 110, y);
    doc.text(`Step ${v.onboardingStep}/6`, 145, y);
    doc.text(`${v.products?.length || 0} SKU`, 165, y);

    // Muted status colors
    const isComp = v.onboardingStep === 6;
    if (isComp) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 110, 60);
      doc.text('DONE', 182, y);
    } else {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
      doc.text('IN FRUIT', 182, y);
    }

    y += 7;
  });

  if (regionVendors.length > 16) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
    doc.text(`* Showing first 16 of ${regionVendors.length} registered brands. Access the Market Stormer portal for complete audit ledger streams.`, 14, y + 2);
  }

  // 3. Signature verification space
  y = 250;
  doc.setDrawColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
  doc.setLineWidth(0.5);
  doc.line(14, y, 74, y);
  doc.line(136, y, 196, y);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED_RGB.r, TEXT_MUTED_RGB.g, TEXT_MUTED_RGB.b);
  doc.text(`${regionName} Command Officer`, 14, y + 5);
  doc.text('Global Onboarding Director sign-off', 136, y + 5);

  drawFooter(doc, 1);

  // Save A4 PDF report
  doc.save(`MARKET_STORMER_REGION_${regionName.replace(/\s+/g, '_')}_REPORT.pdf`);
  return true;
}
