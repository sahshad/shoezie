const Order = require('../model/order')
const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs')

async function getSalesReport(req,res){
  const sales = await Order.find({orderStatus:'Delivered'})
    res.render('admin/salesReport',{sales})
}

async function getCustomSalesReport(req,res) {
  const { reportType, startDate, endDate } = req.body;

const  sales = await Order.find({
    orderStatus: 'Delivered',
    orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
});

if(sales){
res.render('admin/salesReport',{sales})
}
}

async function downloadSalesReport(req,res){
  const {format}= req.query
  if(format === 'pdf'){
    const sales = await Order.find({ orderStatus: 'Delivered' }); // Modify as needed

    const doc = new PDFDocument();
    let filename = 'sales-report.pdf';
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Generate PDF content
    doc.fontSize(14).text('Sales Report', { align: 'center' });
    doc.moveDown();

    sales.forEach(sale => {
        doc.text(`Date: ${sale.orderDate.toLocaleDateString()}`);
        doc.text(`Total Amount: ${sale.totalAmount+(sale.offerDiscount || 0)+(sale.couponDiscount || 0)}`);
        doc.text(`Offer Discount: ${sale.offerDiscount || 0}`);
        doc.text(`Coupon Discount: ${sale.couponDiscount || 0}`)
        doc.text(`Net Amount: ${sale.totalAmount}`)
        doc.moveDown();
    });

    doc.end();
  }else if(format === 'excel'){
    const sales = await Order.find({ orderStatus: 'Delivered' }); // Modify as needed

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add column headers
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Offer Discount', key: 'offer', width: 15 },
        { header: 'Coupon Discount', key: 'coupon', width: 15 },
        { header: 'Net Amount', key: 'netAmount', width: 15 }
    ];

    // Add rows
    sales.forEach(sale => {
        worksheet.addRow({
            date: sale.orderDate.toLocaleDateString(),
            totalAmount: sale.totalAmount+(sale.offerDiscount || 0)+(sale.couponDiscount || 0),
            offer: sale.offerDiscount || 0,
            coupon:sale.couponDiscount || 0,
            netAmount:sale.totalAmount
        });
    });

    // Set filename
    const filename = 'sales-report.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
  }
  
}
module.exports = {
    getSalesReport,getCustomSalesReport,downloadSalesReport
}