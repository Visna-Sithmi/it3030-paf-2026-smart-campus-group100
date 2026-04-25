import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { createTicket } from "../../../services/ticketService";
import { resourceService } from "../../../services/resource.service";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import type { Resource } from "../../../types/resource.types";

type TicketFormState = {
  resourceId: string;
  category: string;
  description: string;
  priority: string;
  preferredContact: string;
};

const CATEGORY_OPTIONS = [
  "IT ISSUE",
  "EQUIPMENT ISSUE",
  "ELECTRICAL",
  "NETWORK",
  "MAINTENANCE",
];

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketFormState>({
    resourceId: "",
    category: "",
    description: "",
    priority: "",
    preferredContact: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("id");

    if (!role || !["STUDENT", "LECTURER"].includes(role) || !id) {
      navigate("/client/login");
    }
  }, [navigate]);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setResourcesLoading(true);
        const role = localStorage.getItem("role");
        if (role === "STUDENT" || role === "LECTURER") {
          const fetchedResources = await resourceService.getResourcesForAudience(
            role as "STUDENT" | "LECTURER"
          );
          setResources(fetchedResources);
        }
      } catch (error) {
        console.error("Failed to load resources:", error);
      } finally {
        setResourcesLoading(false);
      }
    };

    loadResources();
  }, []);

  const previewUrls = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setSuccessMessage("");

    const newFiles = Array.from(e.target.files || []);
    const updatedFiles = [...files, ...newFiles];

    if (updatedFiles.length > 3) {
      setErrorMessage("Maximum 3 images allowed.");
      e.target.value = "";
      return;
    }

    const hasInvalidFile = updatedFiles.some(
      (file) => !file.type.startsWith("image/")
    );

    if (hasInvalidFile) {
      setErrorMessage("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    setFiles(updatedFiles);
    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    if (!form.resourceId.trim()) {
      return "Resource ID is required.";
    }

    if (!form.category.trim()) {
      return "Category is required.";
    }

    if (!form.description.trim()) {
      return "Description is required.";
    }

    if (!form.priority.trim()) {
      return "Priority is required.";
    }

    if (form.description.length < 20) {
      return "Description must be at least 20 characters.";
    }

    if (files.length > 3) {
      return "Maximum 3 images allowed.";
    }

    return "";
  };

  const resetForm = () => {
    setForm({
      resourceId: "",
      category: "",
      description: "",
      priority: "",
      preferredContact: "",
    });
    setFiles([]);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resourceId", form.resourceId);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("priority", form.priority);
      formData.append("preferredContact", form.preferredContact);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await createTicket(formData);
      console.log("Ticket created:", response.data);

      const ticketId = response.data?.data?.id || response.data?.id;
      setSuccessMessage(`Ticket created successfully! (Ticket ID: ${ticketId || "N/A"})`);
      resetForm();
      
      setTimeout(() => {
        navigate("/my-tickets");
      }, 3000);
    } catch (error: any) {
      console.error(error);

      const backendMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : "") ||
        error?.message ||
        "Failed to create ticket.";

      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Header />

      <main className="flex-grow mx-auto w-full max-w-3xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#002147] mb-2">Create Incident Ticket</h1>
          <p className="text-slate-600">
            Report an issue with a campus resource. Provide detailed information to help our team respond quickly.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resource ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Resource <span className="text-red-500">*</span>
              </label>
              {resourcesLoading ? (
                <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Loading resources...
                </div>
              ) : (
                <select
                  name="resourceId"
                  value={form.resourceId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
                >
                  <option value="">Select a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.id} - {resource.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Select the resource you want to report an issue for.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
              >
                <option value="">Select an issue category</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
                >
                  <option value="">Select priority level</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority} Priority
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  High: Urgent response needed | Medium: Standard handling | Low: Can wait
                </p>
              </div>

              {/* Preferred Contact */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Preferred Contact
                </label>
                <input
                  type="text"
                  name="preferredContact"
                  value={form.preferredContact}
                  onChange={handleChange}
                  placeholder="Email or phone number"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
                />
                <p className="mt-1 text-xs text-slate-500">
                  How should we contact you about this ticket?
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail. What happened? When did it start? Any error messages?"
                rows={6}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
              <p className="mt-1 text-xs text-slate-500">
                Minimum 20 characters. The more detail you provide, the faster we can resolve the issue.
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Evidence Attachments
              </label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#002147] transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#002147]" />
                  <p className="text-sm font-medium text-slate-700">
                    Drag images here or click to browse
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, GIF up to 5MB each (maximum 3 images)
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Upload photos of damaged equipment, error screens, or other evidence to help us understand the issue better.
              </p>
            </div>

            {/* Selected Files Preview */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Selected Files ({files.length}/3)
                  </h4>
                </div>

                {/* Image Previews */}
                <div className="grid grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-50"
                    >
                      <img
                        src={url}
                        alt={`preview-${index}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                        {files[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[#002147] px-6 py-3 text-white font-semibold hover:bg-[#001733] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creating Ticket..." : "Create Ticket"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-tickets")}
                className="flex-1 rounded-lg border border-slate-300 px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Your ticket will be reviewed by our maintenance team. You'll receive updates 
                via your preferred contact method. Please check your "My Tickets" section for status updates.
              </p>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}