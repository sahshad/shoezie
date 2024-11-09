document.getElementById('menuToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('page-content-wrapper').classList.toggle('toggled');
});

const salesData = JSON.parse(document.getElementById('sales-data').dataset.sales);

let currentChart; 

const ctx = document.getElementById('salesChart').getContext('2d');

function createChart(period) {
const labels = Object.keys(salesData[period]);
const data = Object.values(salesData[period]);

if (currentChart) {
    currentChart.destroy(); 
}

currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: `${period.charAt(0).toUpperCase() + period.slice(1)} Sales`,
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.2)', 
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Sales Amount (₹)', 
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time Period', 
                }
            }
        }
    }
});
}

function updateChart(period) {
createChart(period);
}

updateChart('weekly');