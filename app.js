// Initialize Supabase
const supabaseUrl = 'https://asgumfyggmcolwjjkcdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZ3VtZnlnZ21jb2x3amprY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNDYyNDYsImV4cCI6MjA1OTkyMjI0Nn0.WLy0QNs8_0ZTS9j80_7-xy5w6sMaX6s5I5E3AGos4oM   ';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const authSection = document.getElementById('authSection');
const employeeDashboard = document.getElementById('employeeDashboard');
const adminDashboard = document.getElementById('adminDashboard');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const saveEmployeeBtn = document.getElementById('saveEmployeeBtn');
const employeesTable = document.getElementById('employeesTable');

// Modal
const addEmployeeModal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    checkUser();
});

// Login function
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        alert(error.message);
    } else {
        checkUser();
    }
});

// Signup function
signupBtn.addEventListener('click', async () => {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const bankName = document.getElementById('bankName').value;
    
    // Default salary for new employees
    const salary = 0;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });
    
    if (authError) {
        alert(authError.message);
        return;
    }
    
    // Add employee data to database
    const { data: empData, error: empError } = await supabase
        .from('employees')
        .insert([
            { 
                name, 
                email, 
                account_number: accountNumber, 
                bank_name: bankName, 
                salary,
                user_id: authData.user.id 
            }
        ]);
    
    if (empError) {
        alert(empError.message);
    } else {
        alert('Signup successful! Please login.');
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('accountNumber').value = '';
        document.getElementById('bankName').value = '';
    }
});

// Logout function
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUser();
});

adminLogoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkUser();
});

// Check user status and show appropriate dashboard
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        authSection.classList.add('d-none');
        
        // Check if user is admin (simple check for demo - in production use proper roles)
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*');
            
        if (error) {
            console.error(error);
            return;
        }
        
        const isAdmin = employees.some(emp => emp.email === user.email);
        
        if (isAdmin) {
            employeeDashboard.classList.add('d-none');
            adminDashboard.classList.remove('d-none');
            loadEmployees();
        } else {
            adminDashboard.classList.add('d-none');
            employeeDashboard.classList.remove('d-none');
            loadEmployeeData(user.id);
        }
    } else {
        authSection.classList.remove('d-none');
        employeeDashboard.classList.add('d-none');
        adminDashboard.classList.add('d-none');
    }
}

// Load employee data for employee dashboard
async function loadEmployeeData(userId) {
    const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.error(error);
        return;
    }
    
    document.getElementById('employeeName').textContent = employee.name;
    document.getElementById('employeeAccount').textContent = employee.account_number;
    document.getElementById('employeeBank').textContent = employee.bank_name;
    document.getElementById('employeeSalary').textContent = employee.salary.toFixed(2);
    
    // Generate QR code for payment
    generateQRCode(employee);
}

// Generate QR code with payment details
function generateQRCode(employee) {
    // Format payment details as UPI payment string (for Indian banks)
    // Adjust this format based on your payment gateway requirements
    const paymentString = `upi://pay?pa=${employee.account_number}@${employee.bank_name.toLowerCase().replace(/\s/g, '')}&pn=${encodeURIComponent(employee.name)}&am=${employee.salary}&cu=USD`;
    
    // Generate QR code
    const qr = qrcode(0, 'L');
    qr.addData(paymentString);
    qr.make();
    
    document.getElementById('qrCode').innerHTML = qr.createImgTag(4);
}

// Load employees for admin dashboard
async function loadEmployees() {
    const { data: employees, error } = await supabase
        .from('employees')
        .select('*');
    
    if (error) {
        console.error(error);
        return;
    }
    
    employeesTable.innerHTML = '';
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.account_number}</td>
            <td>${employee.bank_name}</td>
            <td>$${employee.salary.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-primary pay-btn" data-id="${employee.id}">Pay</button>
                <button class="btn btn-sm btn-warning edit-btn" data-id="${employee.id}">Edit</button>
            </td>
        `;
        employeesTable.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const empId = e.target.getAttribute('data-id');
            payEmployee(empId);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const empId = e.target.getAttribute('data-id');
            editEmployee(empId);
        });
    });
}

// Add new employee
addEmployeeBtn.addEventListener('click', () => {
    // Clear form
    document.getElementById('empName').value = '';
    document.getElementById('empEmail').value = '';
    document.getElementById('empAccount').value = '';
    document.getElementById('empBank').value = '';
    document.getElementById('empSalary').value = '';
    
    addEmployeeModal.show();
});

saveEmployeeBtn.addEventListener('click', async () => {
    const name = document.getElementById('empName').value;
    const email = document.getElementById('empEmail').value;
    const accountNumber = document.getElementById('empAccount').value;
    const bankName = document.getElementById('empBank').value;
    const salary = parseFloat(document.getElementById('empSalary').value);
    
    // In a real app, you would create a user account first
    // For this demo, we'll just add to the employees table
    
    const { data, error } = await supabase
        .from('employees')
        .insert([
            { 
                name, 
                email, 
                account_number: accountNumber, 
                bank_name: bankName, 
                salary,
                user_id: null // No user account for demo
            }
        ]);
    
    if (error) {
        alert(error.message);
    } else {
        addEmployeeModal.hide();
        loadEmployees();
    }
});

// Pay employee
async function payEmployee(empId) {
    const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', empId)
        .single();
    
    if (error) {
        alert(error.message);
        return;
    }
    
    // In a real app, you would integrate with a payment gateway API here
    // For this demo, we'll just show the payment details in a QR code
    
    alert(`Initiating payment of $${employee.salary.toFixed(2)} to ${employee.name}`);
    
    // Show payment QR code in a modal
    const paymentModal = new bootstrap.Modal(document.createElement('div'));
    const modalContent = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Payment to ${employee.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <p>Scan this QR code to pay $${employee.salary.toFixed(2)}</p>
                    <div id="paymentQr"></div>
                    <p class="mt-3">Or send to account:<br>
                    ${employee.account_number}<br>
                    ${employee.bank_name}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    paymentModal._element.innerHTML = modalContent;
    paymentModal.show();
    
    // Generate QR code
    const paymentString = `upi://pay?pa=${employee.account_number}@${employee.bank_name.toLowerCase().replace(/\s/g, '')}&pn=${encodeURIComponent(employee.name)}&am=${employee.salary}&cu=USD`;
    const qr = qrcode(0, 'L');
    qr.addData(paymentString);
    qr.make();
    document.getElementById('paymentQr').innerHTML = qr.createImgTag(4);
}

// Edit employee
async function editEmployee(empId) {
    const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', empId)
        .single();
    
    if (error) {
        alert(error.message);
        return;
    }
    
    // Fill the form
    document.getElementById('empName').value = employee.name;
    document.getElementById('empEmail').value = employee.email;
    document.getElementById('empAccount').value = employee.account_number;
    document.getElementById('empBank').value = employee.bank_name;
    document.getElementById('empSalary').value = employee.salary;
    
    // Change save button to update
    saveEmployeeBtn.textContent = 'Update Employee';
    saveEmployeeBtn.onclick = async () => {
        const name = document.getElementById('empName').value;
        const email = document.getElementById('empEmail').value;
        const accountNumber = document.getElementById('empAccount').value;
        const bankName = document.getElementById('empBank').value;
        const salary = parseFloat(document.getElementById('empSalary').value);
        
        const { data, error } = await supabase
            .from('employees')
            .update({ 
                name, 
                email, 
                account_number: accountNumber, 
                bank_name: bankName, 
                salary 
            })
            .eq('id', empId);
        
        if (error) {
            alert(error.message);
        } else {
            addEmployeeModal.hide();
            loadEmployees();
        }
    };
    
    addEmployeeModal.show();
}