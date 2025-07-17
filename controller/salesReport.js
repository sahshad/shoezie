const Order = require("../model/order");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

async function getSalesReport(req, res) {
  const reportType = "Daily";
  const startDate = 0;
  const endDate = 0;
  const sales = 0;
  res.render("admin/salesReport", { sales, reportType, startDate, endDate, activePage: "sales-report" });
}

async function getCustomSalesReport(req, res) {
  let { reportType, startDate, endDate } = req.body;

  startDate = new Date(startDate);
  startDate = startDate.toISOString();

  endDate = new Date(endDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate = endDate.toISOString();

  const sales = await Order.find({
    orderStatus: "Delivered",
    orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  if (sales) {
    res.render("admin/salesReport", { sales, reportType, startDate, endDate, activePage: "sales-report" });
  }
}

async function downloadSalesReport(req, res) {
  const { format, startDate, endDate } = req.query;

  let sales;
  if (startDate === 0 && endDate === 0) {
    sales = await Order.find({ orderStatus: "Delivered" });
  } else {
    sales = await Order.find({
      orderStatus: "Delivered",
      orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });
  }

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30 });
    let filename = "sales-report.pdf";

    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Sales Report", { align: "center" }).moveDown(1.5);

    const tableTop = 100;
    const rowHeight = 25;
    const colX = [30, 130, 230, 330, 430, 530];

    doc
      .fontSize(12)
      .fillColor("black")
      .text("Date", colX[0] + 5, tableTop + 5);
    doc.text("Total Amount", colX[1] + 5, tableTop + 5);
    doc.text("Offer Discount", colX[2] + 5, tableTop + 5);
    doc.text("Coupon Discount", colX[3] + 5, tableTop + 5);
    doc.text("Net Amount", colX[4] + 5, tableTop + 5);

    drawRowBorders(doc, tableTop, rowHeight, colX);

    let currentY = tableTop + rowHeight;
    let totalOfferDiscount = 0;
    let totalCouponDiscount = 0;
    let totalNetAmount = 0;

    sales.forEach((sale) => {
      const orderDate = sale.orderDate.toLocaleDateString();
      const totalAmount = sale.totalAmount + (sale.offerDiscount || 0) + (sale.couponDiscount || 0);
      const netAmount = sale.totalAmount;

      totalOfferDiscount += sale.offerDiscount || 0;
      totalCouponDiscount += sale.couponDiscount || 0;
      totalNetAmount += netAmount;

      doc
        .fontSize(10)
        .text(orderDate, colX[0] + 5, currentY + 5)
        .text(totalAmount.toFixed(2), colX[1] + 5, currentY + 5)
        .text(sale.offerDiscount.toFixed(2) || 0, colX[2] + 5, currentY + 5)
        .text(sale.couponDiscount.toFixed(2) || 0, colX[3] + 5, currentY + 5)
        .text(netAmount.toFixed(2), colX[4] + 5, currentY + 5);

      drawRowBorders(doc, currentY, rowHeight, colX);
      currentY += rowHeight;
    });

    doc
      .fontSize(10)
      .text("Total", colX[0] + 5, currentY + 5)
      .text("", colX[1] + 5, currentY + 5)
      .text(totalOfferDiscount.toFixed(2), colX[2] + 5, currentY + 5)
      .text(totalCouponDiscount.toFixed(2), colX[3] + 5, currentY + 5)
      .text(totalNetAmount.toFixed(2), colX[4] + 5, currentY + 5);

    drawRowBorders(doc, currentY, rowHeight, colX);

    doc.end();

    function drawRowBorders(doc, y, height, colX) {
      doc
        .moveTo(colX[0], y)
        .lineTo(colX[colX.length - 1], y)
        .stroke();
      doc
        .moveTo(colX[0], y + height)
        .lineTo(colX[colX.length - 1], y + height)
        .stroke();

      colX.forEach((x) => {
        doc
          .moveTo(x, y)
          .lineTo(x, y + height)
          .stroke();
      });
    }
  } else if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Offer Discount", key: "offer", width: 15 },
      { header: "Coupon Discount", key: "coupon", width: 15 },
      { header: "Net Amount", key: "netAmount", width: 15 },
    ];

    let totalOfferDiscount = 0;
    let totalCouponDiscount = 0;
    let totalNetAmount = 0;

    sales.forEach((sale) => {
      const totalAmount = sale.totalAmount + (sale.offerDiscount || 0) + (sale.couponDiscount || 0);
      const netAmount = sale.totalAmount;

      totalOfferDiscount += sale.offerDiscount || 0;
      totalCouponDiscount += sale.couponDiscount || 0;
      totalNetAmount += netAmount;

      worksheet.addRow({
        date: sale.orderDate.toLocaleDateString(),
        totalAmount,
        offer: sale.offerDiscount || 0,
        coupon: sale.couponDiscount || 0,
        netAmount,
      });
    });

    const totalRow = worksheet.addRow({
      date: "Total",
      offer: totalOfferDiscount,
      coupon: totalCouponDiscount,
      netAmount: totalNetAmount,
    });

    totalRow.font = { bold: true };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const filename = "sales-report.xlsx";
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  }
}
module.exports = {
  getSalesReport,
  getCustomSalesReport,
  downloadSalesReport,
};
