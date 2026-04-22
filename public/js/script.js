// Custom styling for form validation using Tailwind CSS

// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custom validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            // Adds the 'was-validated' class to the form.
            // Our custom CSS in boilerplate.ejs will then show the .invalid-feedback elements
            // and apply red borders to invalid inputs.
            form.classList.add('was-validated')
        }, false)
    })
})()