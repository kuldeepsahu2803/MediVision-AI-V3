# 🩺 MediVision AI – Medical Image Analysis using Generative AI

![MediVision AI Banner](screenshot/HomePage.jpeg)

## 🌟 Overview

**MediVision AI** is an advanced medical image analysis platform that leverages Google Gemini Generative AI to extract and interpret medical information from prescriptions, reports, and other medical documents. The application focuses on privacy, accuracy, and usability, providing healthcare professionals and patients with a secure and intuitive way to digitize and analyze medical records.

This MVP demonstrates the application of AI in healthcare with secure configuration practices, a modular frontend architecture, and robust backend infrastructure.

---

## ✨ Key Features

- 📷 **Medical Image Upload**: Support for various medical document formats including prescriptions, reports, and scans
- 🤖 **AI-Powered Analysis**: Advanced interpretation using Google Gemini Generative AI
- ⚡ **Real-time Processing**: Instant results with loading indicators for optimal user experience  
- 🔐 **Secure API Handling**: Environment-based API key management with rate limiting
- 🎨 **Modern UI/UX**: Responsive, accessible interface with dark/light mode support
- 📊 **Comprehensive Reports**: Structured data extraction and analysis results
- 🔄 **Medical History Tracking**: Persistent storage and retrieval of processed records
- 🚀 **Scalable Architecture**: Modular design ready for enterprise deployment

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 19** (TypeScript) - Modern component-based architecture
- ⚡ **Vite** - Fast build tool and development server
- 🎨 **Tailwind CSS** - Utility-first styling framework
- 🎨 **Framer Motion** - Smooth animations and transitions
- 📱 **Responsive Design** - Mobile-first approach with adaptive layouts

### AI & Services
- 🤖 **Google Gemini API** - Advanced multimodal AI for medical image analysis
- 📄 **jsPDF** - PDF generation for reports and documentation
- 🗂️ **IndexedDB** - Client-side storage for offline capabilities

### Backend
- 🚀 **Node.js + Express** - Robust server infrastructure
- 🔒 **Rate Limiting** - Protection against API abuse with 100 requests/hour/IP limit
- 🗄️ **Supabase** - Database and authentication services
- 📦 **ES Modules** - Modern module system for dependency management

### Development & Deployment
- 📁 **Modular Architecture** - Component-based design for maintainability

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20.x or higher
- Google Gemini API Key
- Modern web browser (Chrome/Firefox/Safari)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kuldeepsahu0328/medivision-ai-v3.git
cd medivision-ai-v3
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Configure your Google Gemini API key**
```bash
# In your .env file
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

5. **Run the development server**
```bash
npm run dev
```

6. **For production deployment**
```bash
# Build the application
npm run build

# Start the production server
npm start
```

---

## 🔧 Configuration

### Environment Variables
- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI processing
- `PORT` - Server port (defaults to 3001)
- `SUPABASE_URL` - Supabase project URL (if using database features)
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Rate Limiting
The backend implements rate limiting to protect API quotas:
- 100 requests per hour per IP address
- Localhost is exempt from rate limiting
- Custom error messages for quota exceeded scenarios

---

## 📋 Usage Guide

### User Roles
MediVision AI supports two user types:
- **Guest**: Temporary sessions for quick analysis (data resets on refresh)
- **Professional**: Registered users with persistent medical history

### Workflow
1. **Role Selection**: Choose between guest or professional access
2. **Service Selection**: Select the type of medical analysis (currently prescription analysis)
3. **Upload**: Drag and drop or select medical images/documents
4. **Analyze**: AI processes the uploaded content
5. **Review**: Examine extracted data and verify accuracy
6. **Report**: Generate and download comprehensive reports
7. **Track**: Access historical data and trends

### Supported File Types
- Images: JPG, PNG, JPEG, WEBP
- Documents: PDF (coming soon)

---

## 📸 Screenshots

### Home Page
![Home Page](screenshot/HomePage.jpeg)
*Clean, modern landing page with intuitive navigation*

### Upload & Analysis Interface
![Upload and Analyze](screenshot/Upload_and_Analyze.jpeg)
*Simple drag-and-drop interface for uploading medical documents*

### Data Review & Editing
![Edit Data](screenshot/Edit_Data.jpeg)
*Interactive interface for reviewing and editing extracted medical data*

### Comprehensive Reports
![Report View](screenshot/Report.jpeg)
*Detailed analysis reports with structured medical information*

---

## 🔐 Security & Privacy

### Data Protection
- Client-side encryption for sensitive information
- Secure API key handling via environment variables
- Rate limiting to prevent API abuse
- Anonymous user sessions for guest access

### Compliance Considerations
- HIPAA compliance ready architecture
- Encrypted data transmission
- Secure storage options with Supabase integration
- Audit trail capabilities for professional accounts

---

## 🧠 AI Integration

### Google Gemini Features
- **Multimodal Processing**: Handles both text and image inputs
- **Medical Context Understanding**: Specialized for healthcare terminology
- **Structured Output**: Consistent data formats for downstream processing
- **Confidence Scoring**: Quality indicators for extracted information

### Analysis Capabilities
- Prescription interpretation and drug identification
- Dosage extraction and frequency analysis
- Drug interaction warnings
- Medical terminology standardization

---

## 🏗️ Project Structure

```
medivision-ai/
├── components/           # Reusable UI components
│   ├── layout/          # Layout components
│   ├── ui/             # Base UI elements
│   ├── skeletons/      # Loading states
│   └── icons/          # Icon components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── lib/                # Utility functions
├── db/                 # Database utilities
├── screenshot/         # Project screenshots
├── tests/              # Unit and integration tests
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── server.js           # Backend server implementation
└── ...
```

---


## 🙏 Acknowledgments

- Google Gemini team for the powerful AI capabilities
- The React community for excellent development tools
- Healthcare professionals who provided domain expertise
- Open source contributors whose libraries power this project

---

<div align="center">

**MediVision AI** - Transforming medical documentation with artificial intelligence

⭐ Star this repo if you find it helpful!

</div>
