document.addEventListener('DOMContentLoaded', function() {
    var firstnameInput = document.getElementById('firstname');
    var lastnameInput = document.getElementById('lastname');
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    var confirmPasswordInput = document.getElementById('confirmPassword');
	
    function validatefirstName() {
        var name = firstnameInput.value;
        if(name===''){
            firstnameInput.classList.remove('is-invalid', 'is-valid');
            firstnameInput.nextElementSibling.style.display = 'none';
        }else if(name.length<3){
            firstnameInput.classList.add('is-invalid');
            firstnameInput.classList.remove('is-valid');
            firstnameInput.nextElementSibling.style.display = 'block';
        }else{
            firstnameInput.classList.remove('is-invalid');
            firstnameInput.classList.add('is-valid');
            firstnameInput.nextElementSibling.style.display = 'none';
        }
    }

    function validatelastName() {
        var name = lastnameInput.value;
        if(name===''){
            lastnameInput.classList.remove('is-invalid', 'is-valid');
            lastnameInput.nextElementSibling.style.display = 'none';
        }else if(name.length<3){
            lastnameInput.classList.add('is-invalid');
            lastnameInput.classList.remove('is-valid');
            lastnameInput.nextElementSibling.style.display = 'block';
        }else{
            lastnameInput.classList.remove('is-invalid');
            lastnameInput.classList.add('is-valid');
            lastnameInput.nextElementSibling.style.display = 'none';
        }
    }

    function validateEmail() {
        var email = emailInput.value;
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            emailInput.classList.remove('is-invalid', 'is-valid');
            emailInput.nextElementSibling.style.display = 'none';
        } else if (!emailPattern.test(email)) {
            emailInput.classList.add('is-invalid');
            emailInput.classList.remove('is-valid');
            emailInput.nextElementSibling.style.display = 'block';
        } else {
            emailInput.classList.remove('is-invalid');
            emailInput.classList.add('is-valid');
            emailInput.nextElementSibling.style.display = 'none';
        }
    }
    function validatePassword() {
        var password = passwordInput.value;
        if (password === '') {
            passwordInput.classList.remove('is-invalid', 'is-valid');
            passwordInput.nextElementSibling.style.display = 'none';
        } else if (password.length < 6) {
            passwordInput.classList.add('is-invalid');
            passwordInput.classList.remove('is-valid');
            passwordInput.nextElementSibling.style.display = 'block';
        } else {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
            passwordInput.nextElementSibling.style.display = 'none';
        }
    }
    function isPasswordMatch(){
       var password = passwordInput.value;
       var confirmPassword = confirmPasswordInput.value
       
       if(confirmPassword===''){
        confirmPasswordInput.classList.remove('is-invalid', 'is-valid');
        confirmPasswordInput.nextElementSibling.style.display = 'none';
       }else if (password!==confirmPassword){
        confirmPasswordInput.classList.add('is-invalid');
        confirmPasswordInput.classList.remove('is-valid');
        confirmPasswordInput.nextElementSibling.style.display = 'block';
       }else{
        confirmPasswordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.add('is-valid');
        confirmPasswordInput.nextElementSibling.style.display = 'none';
       }
    }
    firstnameInput.addEventListener('input',()=>{
        validatefirstName();
    })
    lastnameInput.addEventListener('input',()=>{
        validatelastName();
    })
    emailInput.addEventListener('input', function() {
        validateEmail();
    });
    passwordInput.addEventListener('input', function() {
        validatePassword();
    });
    confirmPasswordInput.addEventListener('input',()=>{
        isPasswordMatch();
    })
    document.getElementById('signupForm').addEventListener('submit', function(event) {
        var name =nameInput.value;
        var email = emailInput.value;
        var password = passwordInput.value;
        var confirmPassword=confirmPasswordInput.value;
        
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email) || password.length < 6 || name.length < 5 || confirmPassword!==password) {
            event.preventDefault();
        }
    });
    // Initialize validation on load to handle case when fields have default values
    validatefirstName();
    validatelastName();
    validateEmail();
    validatePassword();
    isPasswordMatch();
});