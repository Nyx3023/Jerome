// Utility to resolve logo URL for PDF forms
import logoForForms from '../assets/logo-for-forms.png';

export const resolveLogoUrl = async () => {
  // Return the imported logo as a data URL for PDF embedding
  try {
    const response = await fetch(logoForForms);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    // Fallback to the direct import path
    return logoForForms;
  }
};

// Direct logo path for use in components
export { logoForForms };

