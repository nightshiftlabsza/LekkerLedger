import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Employee, PayslipInput } from "./schema";
import { calculatePayslip } from "./calculator";
import { format } from "date-fns";

export async function generatePayslipPdfBytes(
  employee: Employee,
  payslip: PayslipInput,
): Promise<Uint8Array> {
  const breakdown = calculatePayslip(payslip);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 842.89]); // A4

  const width = page.getWidth();
  const height = page.getHeight();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (
    text: string,
    x: number,
    y: number,
    font = helvetica,
    size = 10,
    color = rgb(0.07, 0.07, 0.1),
  ) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const slate = rgb(0.45, 0.49, 0.56);
  const blue = rgb(0.15, 0.37, 0.86);
  const red = rgb(0.8, 0.15, 0.1);
  const white = rgb(1, 1, 1);

  // ─── Header band ───────────────────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: rgb(0.07, 0.09, 0.13),
  });

  drawText("PAYSLIP", 50, height - 55, helveticaBold, 28, white);
  drawText(
    "LekkerLedger",
    50,
    height - 80,
    helvetica,
    11,
    rgb(0.6, 0.65, 0.75),
  );
  drawText(
    "CONFIDENTIAL",
    width - 140,
    height - 55,
    helveticaBold,
    10,
    rgb(0.4, 0.45, 0.55),
  );

  // ─── Employee info ─────────────────────────────────────────────────────────
  const infoY = height - 145;
  drawText("EMPLOYEE", 50, infoY, helveticaBold, 8, slate);
  drawText(employee.name, 50, infoY - 18, helveticaBold, 13);
  drawText(employee.role, 50, infoY - 36, helvetica, 10, slate);
  if (employee.idNumber) {
    drawText(`ID: ${employee.idNumber}`, 50, infoY - 52, helvetica, 9, slate);
  }

  const payPeriodStr = `${format(payslip.payPeriodStart, "d MMM")} – ${format(payslip.payPeriodEnd, "d MMM yyyy")}`;
  drawText("PAY PERIOD", width - 200, infoY, helveticaBold, 8, slate);
  drawText(payPeriodStr, width - 200, infoY - 18, helvetica, 10);
  drawText("Generated:", width - 200, infoY - 36, helvetica, 9, slate);
  drawText(
    format(new Date(), "d MMM yyyy"),
    width - 200,
    infoY - 52,
    helvetica,
    9,
    slate,
  );

  // ─── Divider ───────────────────────────────────────────────────────────────
  const divY = height - 220;
  page.drawLine({
    start: { x: 50, y: divY },
    end: { x: width - 50, y: divY },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.93),
  });

  // ─── Earnings column ───────────────────────────────────────────────────────
  let earningsY = divY - 30;
  drawText("EARNINGS", 50, earningsY, helveticaBold, 8, slate);
  earningsY -= 20;

  const earningRows: [string, number][] = [
    [
      `Ordinary hours (${payslip.ordinaryHours} h × R${payslip.hourlyRate.toFixed(2)})`,
      breakdown.ordinaryPay,
    ],
  ];
  if (payslip.overtimeHours > 0) {
    earningRows.push([
      `Overtime (${payslip.overtimeHours} h × R${(payslip.hourlyRate * 1.5).toFixed(2)})`,
      breakdown.overtimePay,
    ]);
  }
  if (payslip.sundayHours > 0) {
    earningRows.push([
      `Sunday (${payslip.sundayHours} h × R${(payslip.hourlyRate * 2).toFixed(2)})`,
      breakdown.sundayPay,
    ]);
  }
  if (payslip.publicHolidayHours > 0) {
    earningRows.push([
      `Public holiday (${payslip.publicHolidayHours} h × R${(payslip.hourlyRate * 2).toFixed(2)})`,
      breakdown.publicHolidayPay,
    ]);
  }

  for (const [label, amount] of earningRows) {
    drawText(label, 50, earningsY, helvetica, 10, slate);
    drawText(`R ${amount.toFixed(2)}`, width - 180, earningsY, helvetica, 10);
    earningsY -= 20;
  }

  // Gross subtotal
  earningsY -= 5;
  page.drawLine({
    start: { x: 50, y: earningsY },
    end: { x: width - 50, y: earningsY },
    thickness: 0.5,
    color: rgb(0.88, 0.9, 0.93),
  });
  earningsY -= 18;
  drawText("Gross Pay", 50, earningsY, helveticaBold, 11);
  drawText(
    `R ${breakdown.grossPay.toFixed(2)}`,
    width - 180,
    earningsY,
    helveticaBold,
    11,
  );

  // ─── Deductions ────────────────────────────────────────────────────────────
  earningsY -= 35;
  drawText("DEDUCTIONS", 50, earningsY, helveticaBold, 8, slate);
  earningsY -= 20;

  const uifLabel =
    breakdown.totalHours > 24
      ? "UIF (employee 1%)"
      : "UIF (≤ 24 hrs — not applicable)";
  drawText(uifLabel, 50, earningsY, helvetica, 10, slate);
  drawText(
    `-R ${breakdown.deductions.uifEmployee.toFixed(2)}`,
    width - 180,
    earningsY,
    helvetica,
    10,
    red,
  );
  earningsY -= 20;

  if (payslip.includeAccommodation && breakdown.deductions.accommodation) {
    drawText(
      "Accommodation deduction (10%)",
      50,
      earningsY,
      helvetica,
      10,
      slate,
    );
    drawText(
      `-R ${breakdown.deductions.accommodation.toFixed(2)}`,
      width - 180,
      earningsY,
      helvetica,
      10,
      red,
    );
    earningsY -= 20;
  }

  earningsY -= 5;
  page.drawLine({
    start: { x: 50, y: earningsY },
    end: { x: width - 50, y: earningsY },
    thickness: 0.5,
    color: rgb(0.88, 0.9, 0.93),
  });
  earningsY -= 18;
  drawText("Total Deductions", 50, earningsY, helveticaBold, 11);
  drawText(
    `R ${breakdown.deductions.total.toFixed(2)}`,
    width - 180,
    earningsY,
    helveticaBold,
    11,
  );

  // ─── Net Pay block ─────────────────────────────────────────────────────────
  earningsY -= 45;
  page.drawRectangle({
    x: 50,
    y: earningsY - 20,
    width: width - 100,
    height: 60,
    color: blue,
  });
  drawText("NET PAY", 75, earningsY + 10, helveticaBold, 13, white);
  drawText(
    `R ${breakdown.netPay.toFixed(2)}`,
    width - 200,
    earningsY + 5,
    helveticaBold,
    22,
    white,
  );

  // ─── Employer contribution ─────────────────────────────────────────────────
  earningsY -= 55;
  drawText(
    `Employer UIF contribution (1%): R ${breakdown.employerContributions.uifEmployer.toFixed(2)}`,
    50,
    earningsY,
    helvetica,
    9,
    slate,
  );

  // ─── Footer ────────────────────────────────────────────────────────────────
  const footerY = 55;
  page.drawLine({
    start: { x: 50, y: footerY + 20 },
    end: { x: width - 50, y: footerY + 20 },
    thickness: 0.5,
    color: rgb(0.88, 0.9, 0.93),
  });
  drawText(
    "This payslip was generated in compliance with the Basic Conditions of Employment Act (BCEA) and Sectoral Determination 7 (domestic workers).",
    50,
    footerY,
    helvetica,
    7,
    slate,
  );
  drawText(
    "Powered by LekkerLedger — lekkerledger.app",
    50,
    footerY - 14,
    helvetica,
    7,
    rgb(0.65, 0.7, 0.78),
  );

  return pdfDoc.save();
}
