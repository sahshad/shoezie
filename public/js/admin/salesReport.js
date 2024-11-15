document.getElementById('reportType').addEventListener('change', function() {
    const selectedValue = this.value;
    const dateFields = document.getElementById('dateFields');
    const endDateField = document.getElementById('endDateField');
    
    if (selectedValue === 'custom') {
        dateFields.style.display = 'block';
        endDateField.style.display = 'block';
    } else {
        dateFields.style.display = 'none';
        endDateField.style.display = 'none';
    }
})
        function generateReport() {
            const reportType = document.getElementById('reportType').value;
            let startDate, endDate;

            if (reportType === 'daily') {
                const today = new Date();
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0); 
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            } else if (reportType === 'weekly') {
                const today = new Date();
                const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
                const lastDayOfWeek = new Date(today.setDate(firstDayOfWeek.getDate() + 6));
                startDate = firstDayOfWeek.toISOString().split('T')[0];
                endDate = lastDayOfWeek.toISOString().split('T')[0];
            } else if (reportType === 'monthly') {
                const today = new Date();
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (reportType === 'yearly') {
                const today = new Date();
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
            } else {
                startDate = document.getElementById('startDate').value;
                endDate = document.getElementById('endDate').value;
                if(new Date(startDate) > new Date() || new Date(endDate) > new Date()){    
                    Swal.fire('Error!', 'Date must be past date', 'error');
                    return;
                }
            }
            if(!startDate || !endDate){
                Swal.fire('Error!', 'Start date or end date cannot be empty', 'error');
                    return;
            }

            if(startDate > endDate){
                Swal.fire('Error!', 'End date should be greater than start date ', 'error');
                    return;
            }

            const requestData = {
                reportType,
                startDate,
                endDate,
            };            
            
            fetch(`/admin/sales-report/${startDate}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text(); 
    })
    .then(html => {
        document.open();
        document.write(html);
        document.close();
        
    })
    .catch(error => {
        console.error('Error generating report:', error);
        alert('Error generating report. Please try again.');
    });

        }

        function downloadReport(format,start,end) {
            window.location.href = `/admin/sales-report/download?format=${format}&startDate=${start}&endDate=${end}`;
        }