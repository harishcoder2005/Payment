// Razorpay configuration
const razorpayKey = 'YOUR_RAZORPAY_KEY_ID'; // Replace with your Razorpay key

// DOM Elements
const paymentForm = document.getElementById('paymentForm');
const paymentSection = document.getElementById('paymentSection');
const payNowBtn = document.getElementById('payNowBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const paymentStatusModal = new bootstrap.Modal(document.getElementById('paymentStatusModal'));

// Store employee data
let currentEmployee = null;

// Form submission
paymentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    currentEmployee = {
        name: document.getElementById('employeeName').value,
        email: document.getElementById('employeeEmail').value,
        accountNumber: document.getElementById('employeeAccount').value,
        bankName: document.getElementById('employeeBank').value,
        salary: parseFloat(document.getElementById('employeeSalary').value)
    };
    
    // Display payment details
    document.getElementById('displayName').textContent = currentEmployee.name;
    document.getElementById('displayAccount').textContent = currentEmployee.accountNumber;
    document.getElementById('displayBank').textContent = currentEmployee.bankName;
    document.getElementById('displaySalary').textContent = currentEmployee.salary.toFixed(2);
    
    // Show payment section
    paymentSection.classList.remove('d-none');
    
    // Scroll to payment section
    paymentSection.scrollIntoView({ behavior: 'smooth' });
});

// Pay Now button
payNowBtn.addEventListener('click', function() {
    if (currentEmployee) {
        initiatePayment(currentEmployee);
    }
});

// Reset form
resetFormBtn.addEventListener('click', function() {
    paymentForm.reset();
    paymentSection.classList.add('d-none');
    currentEmployee = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initiate Razorpay payment
async function initiatePayment(employee) {
    try {
        // In a production app, you would call your backend to create an order
        // For this demo, we'll simulate it client-side
        
        const paymentAmount = employee.salary * 100; // Razorpay uses paise (multiply by 100)
        
        const options = {
            key: razorpayKey,
            amount: paymentAmount,
            currency: 'INR',
            name: 'Salary Payment System',
            description: `Salary payment for ${employee.name}`,
            image: 'https://example.com/your_logo.png', // Add your logo
            handler: function(response) {
                // Handle successful payment
                showPaymentStatus('success', `Payment of ₹${employee.salary.toFixed(2)} to ${employee.name} was successful!`, response);
                
                // In a real app, you would verify the payment signature with your backend
                // and update your database with the payment details
            },
            prefill: {
                name: employee.name,
                email: employee.email,
                contact: '' // Add employee phone number if available
            },
            notes: {
                account_number: employee.accountNumber,
                bank_name: employee.bankName
            },
            theme: {
                color: '#3399cc'
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
        rzp.on('payment.failed', function(response) {
            showPaymentStatus('failed', `Payment failed for ${employee.name}. Please try again.`, response);
        });
        
    } catch (error) {
        console.error('Payment error:', error);
        showPaymentStatus('error', 'An error occurred while processing the payment.');
    }
}

// Show payment status
function showPaymentStatus(status, message, response = null) {
    const statusTitle = document.getElementById('paymentStatusTitle');
    const statusBody = document.getElementById('paymentStatusBody');
    
    if (status === 'success') {
        statusTitle.textContent = 'Payment Successful';
        statusBody.innerHTML = `
            <div class="alert alert-success">
                ${message}
            </div>
            <div class="mt-3">
                <h6>Payment Details:</h6>
                <p>Payment ID: ${response.razorpay_payment_id}</p>
                <p>Order ID: ${response.razorpay_order_id}</p>
                <p>Signature: ${response.razorpay_signature}</p>
            </div>
            <p class="mt-2">A receipt has been sent to ${currentEmployee.email}</p>
        `;
    } else if (status === 'failed') {
        statusTitle.textContent = 'Payment Failed';
        statusBody.innerHTML = `
            <div class="alert alert-danger">
                ${message}
            </div>
            ${response ? `<p>Error: ${response.error.description}</p>` : ''}
            <p>Please try the payment again.</p>
        `;
    } else {
        statusTitle.textContent = 'Payment Error';
        statusBody.innerHTML = `
            <div class="alert alert-warning">
                ${message}
            </div>
            <p>Please contact support if the problem persists.</p>
        `;
    }
    
    paymentStatusModal.show();
}
