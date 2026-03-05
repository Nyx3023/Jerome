export default function signupValidation(values) {
    let errors = {};

    // Email validation
    if (!values.email) {
        errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = "Email is invalid";
    } else if (!/@gmail\.com$/i.test(values.email)) {
        errors.email = "Only Gmail addresses are allowed";
    }

    // Password validation
    if (!values.password) {
        errors.password = "Password is required";
    } else if (values.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!values.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
    } else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = "Passwords do not match";
    }

    return errors;
} 