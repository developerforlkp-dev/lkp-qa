import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Download, Mail, Paperclip, Phone, ShieldAlert, Ticket, Trash2, User } from "lucide-react";
import {
  createSupportTicket,
  downloadCustomerSupportTicketAttachment,
  getCustomerProfile,
  getCustomerSupportTicketDetails,
  getCustomerSupportTickets,
  getSupportGuest,
} from "../../utils/api";
import styles from "./Support.module.sass";

const DEFAULT_COUNTRY_CODE = "+91";

const COUNTRY_CODE_OPTIONS = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+65", label: "Singapore (+65)" },
  { value: "+971", label: "UAE (+971)" },
];

const ISSUE_CATEGORY_OPTIONS = [
  "Booking Issue",
  "Payment Issue",
  "Technical Issue",
  "Listing Information",
  "Refund/Cancellation",
  "Other",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitialFormState = () => ({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerCountryCode: DEFAULT_COUNTRY_CODE,
  issueCategory: "",
  customIssueText: "",
  subject: "",
  description: "",
  attachments: [],
});

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (size) => {
  const numeric = Number(size || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0 KB";
  if (numeric >= 1024 * 1024) return `${(numeric / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(numeric / 1024))} KB`;
};

const getCompactFileName = (fileName) => {
  const raw = String(fileName || "Attachment").trim();
  if (!raw) return "Attachment";

  const lastDotIndex = raw.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < raw.length - 1;
  const extension = hasExtension ? raw.slice(lastDotIndex) : "";
  const baseName = hasExtension ? raw.slice(0, lastDotIndex) : raw;
  const maxBaseLength = 16;

  if (baseName.length <= maxBaseLength) return raw;

  return `${baseName.slice(0, maxBaseLength).trim()}...${extension}`;
};

const getStatusTone = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "RESOLVED":
      return styles.statusResolved;
    case "OPEN":
      return styles.statusOpen;
    default:
      return styles.statusNeutral;
  }
};

const getErrorText = (value, fallback) => {
  if (typeof value === "string" && value.trim()) return value;

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === "string" && item.trim());
    if (firstString) return firstString;
  }

  if (value && typeof value === "object") {
    const formErrors = value.formErrors || value.form_errors;
    if (Array.isArray(formErrors)) {
      const firstFormError = formErrors.find((item) => typeof item === "string" && item.trim());
      if (firstFormError) return firstFormError;
    }

    const fieldErrors = value.fieldErrors || value.field_errors || value.errors;
    if (fieldErrors && typeof fieldErrors === "object") {
      for (const fieldValue of Object.values(fieldErrors)) {
        if (Array.isArray(fieldValue)) {
          const firstFieldError = fieldValue.find((item) => typeof item === "string" && item.trim());
          if (firstFieldError) return firstFieldError;
        }
        if (typeof fieldValue === "string" && fieldValue.trim()) return fieldValue;
      }
    }
  }

  return fallback;
};

const Support = () => {
  const [form, setForm] = useState(getInitialFormState);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [supportData, setSupportData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [ticketDetailError, setTicketDetailError] = useState("");
  const [ticketDetail, setTicketDetail] = useState(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    let mounted = true;

    const loadSupportContext = async () => {
      try {
        const data = await getSupportGuest();
        if (mounted) setSupportData(data || null);
      } catch (error) {
        console.error("Failed to load support guest data", error);
      }
    };

    const loadProfile = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
      if (mounted) setIsLoggedIn(Boolean(token));
      if (!token) {
        if (mounted) setLoadingPrefill(false);
        return;
      }

      try {
        const data = await getCustomerProfile();
        const customer = data?.customer;
        if (!mounted || !customer) return;

        const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
        setForm((prev) => ({
          ...prev,
          customerName: prev.customerName || fullName,
          customerEmail: prev.customerEmail || customer.email || "",
          customerPhone: prev.customerPhone || customer.phone || "",
          customerCountryCode: customer.countryCode || prev.customerCountryCode || DEFAULT_COUNTRY_CODE,
        }));
      } catch (error) {
        console.error("Failed to prefill support form", error);
      } finally {
        if (mounted) setLoadingPrefill(false);
      }
    };

    loadSupportContext();
    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedTickets = useMemo(() => (
    [...tickets].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    })
  ), [tickets]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let mounted = true;

    const loadTickets = async () => {
      try {
        setTicketsLoading(true);
        setTicketsError("");
        const data = await getCustomerSupportTickets();
        if (!mounted) return;
        setTickets(Array.isArray(data) ? data : []);
        setSelectedTicketId((prev) => {
          if (prev && data.some((ticket) => String(ticket.ticketId) === String(prev))) return prev;
          return data[0]?.ticketId || "";
        });
      } catch (error) {
        if (!mounted) return;
        const data = error?.response?.data || {};
        setTicketsError(getErrorText(data?.message || data?.error || data, "Could not load your support tickets."));
      } finally {
        if (mounted) setTicketsLoading(false);
      }
    };

    loadTickets();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !selectedTicketId) {
      setTicketDetail(null);
      setTicketDetailError("");
      setTicketDetailLoading(false);
      return;
    }

    let mounted = true;

    const loadTicketDetail = async () => {
      try {
        setTicketDetailLoading(true);
        setTicketDetailError("");
        setDownloadError("");
        const data = await getCustomerSupportTicketDetails(selectedTicketId);
        if (!mounted) return;
        setTicketDetail(data || null);
      } catch (error) {
        if (!mounted) return;
        const data = error?.response?.data || {};
        setTicketDetailError(getErrorText(data?.message || data?.error || data, "Could not load this ticket."));
        setTicketDetail(null);
      } finally {
        if (mounted) setTicketDetailLoading(false);
      }
    };

    loadTicketDetail();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn, selectedTicketId]);

  const contacts = Array.isArray(supportData?.contacts) ? supportData.contacts : [];
  const faqs = Array.isArray(supportData?.faqs) ? supportData.faqs : [];

  const countryCodeOptions = useMemo(() => {
    const currentValue = form.customerCountryCode || DEFAULT_COUNTRY_CODE;
    return COUNTRY_CODE_OPTIONS.some((option) => option.value === currentValue)
      ? COUNTRY_CODE_OPTIONS
      : [{ value: currentValue, label: `Current (${currentValue})` }, ...COUNTRY_CODE_OPTIONS];
  }, [form.customerCountryCode]);

  const setFieldValue = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormError("");
    setSuccess(null);
  };

  const handleRemoveAttachment = (index) => {
    setForm((prev) => {
      const attachments = prev.attachments.filter((_, itemIndex) => itemIndex !== index);
      return { ...prev, attachments };
    });
    setErrors((prev) => ({ ...prev, attachments: "" }));
  };

  const handleAttachmentSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const existingFiles = form.attachments || [];
    const mergedFiles = [...existingFiles, ...selectedFiles].slice(0, 5);

    setForm((prev) => ({ ...prev, attachments: mergedFiles }));
    setErrors((prev) => ({
      ...prev,
      attachments: selectedFiles.length + existingFiles.length > 5 ? "You can upload up to 5 files." : "",
    }));
    setFormError("");
    setSuccess(null);

    event.target.value = "";
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.customerName.trim()) nextErrors.customerName = "Customer name is required.";
    if (!form.customerPhone.trim()) nextErrors.customerPhone = "Phone number is required.";
    if (!form.customerCountryCode.trim()) nextErrors.customerCountryCode = "Country code is required.";
    if (!form.issueCategory.trim()) nextErrors.issueCategory = "Issue category is required.";
    if (!form.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";

    if (form.customerEmail.trim() && !EMAIL_REGEX.test(form.customerEmail.trim())) {
      nextErrors.customerEmail = "Please enter a valid email address.";
    }

    if ((form.attachments || []).length > 5) {
      nextErrors.attachments = "You can upload up to 5 files.";
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      attachmentValues: form.attachments || [],
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { isValid, attachmentValues } = validateForm();
    if (!isValid) return;

    const payload = {
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      customerPhone: form.customerPhone.trim(),
      customerCountryCode: form.customerCountryCode.trim(),
      issueCategory: form.issueCategory.trim(),
      customIssueText: form.customIssueText.trim() || undefined,
      subject: form.subject.trim(),
      description: form.description.trim(),
      attachments: attachmentValues,
    };

    setSubmitting(true);
    setFormError("");
    setSuccess(null);

    try {
      const response = await createSupportTicket(payload);
      const nextTicketId =
        response?.ticketId ||
        response?.supportTicketId ||
        response?.ticket?.ticketId ||
        response?.data?.ticketId ||
        "";

      setSuccess({
        message:
          response?.message ||
          response?.data?.message ||
          "Your support ticket has been submitted successfully.",
        ticketId: nextTicketId,
      });
      setForm(getInitialFormState());
      setErrors({});

      if (isLoggedIn) {
        try {
          const refreshedTickets = await getCustomerSupportTickets();
          setTickets(Array.isArray(refreshedTickets) ? refreshedTickets : []);
          if (nextTicketId) {
            setSelectedTicketId(nextTicketId);
          } else if (Array.isArray(refreshedTickets) && refreshedTickets[0]?.ticketId) {
            setSelectedTicketId(refreshedTickets[0].ticketId);
          }
        } catch (refreshError) {
          console.error("Failed to refresh support tickets after create", refreshError);
        }
      }
    } catch (error) {
      const data = error?.response?.data || {};
      const fieldErrors = data?.fieldErrors || data?.errors || {};
      const normalizedErrors = {};

      Object.entries(fieldErrors).forEach(([key, value]) => {
        normalizedErrors[key] = Array.isArray(value) ? value.find(Boolean) : value;
      });

      if (Object.keys(normalizedErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...normalizedErrors }));
      }

      setFormError(getErrorText(
        data?.message || data?.error || data,
        "We couldn't submit your ticket right now. Please review the form and try again."
      ));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentDownload = async (ticketId, attachment) => {
    const attachmentId = attachment?.supportTicketAttachmentId;
    if (!ticketId || attachmentId == null) return;

    try {
      setDownloadingAttachmentId(attachmentId);
      setDownloadError("");
      const response = await downloadCustomerSupportTicketAttachment(ticketId, attachmentId);
      const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const contentDisposition = response?.headers?.["content-disposition"] || "";
      const serverNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      const serverFileName = serverNameMatch?.[1] ? decodeURIComponent(serverNameMatch[1].replace(/"/g, "")) : "";
      link.href = url;
      link.download = serverFileName || attachment?.fileName || `attachment-${attachmentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const data = error?.response?.data || {};
      setDownloadError(getErrorText(data?.message || data?.error || data, "Could not download the attachment."));
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const detailTicket = ticketDetail?.ticket || null;
  const detailMessages = Array.isArray(ticketDetail?.messages)
    ? [...ticketDetail.messages].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    : [];
  const detailAttachments = Array.isArray(ticketDetail?.attachments) ? ticketDetail.attachments : [];
  const showTicketsTab = isLoggedIn;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Customer Support</div>
        <h1 className={styles.title}>Support hub</h1>
        <p className={styles.subtitle}>
          Reach the support team, share supporting files, and track your requests from one place.
        </p>
      </section>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "create" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("create")}
        >
          Raise Ticket
        </button>
        {showTicketsTab ? (
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "tickets" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("tickets")}
          >
            My Tickets
          </button>
        ) : null}
      </div>

      {activeTab === "create" ? (
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Ticket details</h2>
              <p className={styles.cardSubtitle}>
                Required fields are marked. You can submit this form even if you are not logged in.
              </p>
            </div>
            {loadingPrefill && <span className={styles.prefillBadge}>Loading saved contact details...</span>}
          </div>

          {success && (
            <div className={styles.successBox}>
              <CheckCircle2 size={22} />
              <div>
                <strong>{success.message}</strong>
                {success.ticketId ? <span>Ticket ID: {success.ticketId}</span> : null}
              </div>
            </div>
          )}

          {formError ? <div className={styles.formError}>{formError}</div> : null}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="customerName">Customer Name *</label>
                <input
                  id="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setFieldValue("customerName", e.target.value)}
                  disabled={submitting}
                />
                {errors.customerName ? <span className={styles.errorText}>{errors.customerName}</span> : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="customerEmail">Customer Email</label>
                <input
                  id="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setFieldValue("customerEmail", e.target.value)}
                  disabled={submitting}
                />
                {errors.customerEmail ? <span className={styles.errorText}>{errors.customerEmail}</span> : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="customerCountryCode">Country Code *</label>
                <select
                  id="customerCountryCode"
                  value={form.customerCountryCode}
                  onChange={(e) => setFieldValue("customerCountryCode", e.target.value)}
                  disabled={submitting}
                >
                  {countryCodeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.customerCountryCode ? <span className={styles.errorText}>{errors.customerCountryCode}</span> : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="customerPhone">Phone Number *</label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setFieldValue("customerPhone", e.target.value)}
                  disabled={submitting}
                />
                {errors.customerPhone ? <span className={styles.errorText}>{errors.customerPhone}</span> : null}
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="issueCategory">Issue Category *</label>
                <select
                  id="issueCategory"
                  value={form.issueCategory}
                  onChange={(e) => setFieldValue("issueCategory", e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Select an issue category</option>
                  {ISSUE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.issueCategory ? <span className={styles.errorText}>{errors.issueCategory}</span> : null}
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="customIssueText">Custom Issue Text</label>
                <textarea
                  id="customIssueText"
                  rows="3"
                  placeholder="Add any quick context that helps classify the issue."
                  value={form.customIssueText}
                  onChange={(e) => setFieldValue("customIssueText", e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="subject">Subject *</label>
                <input
                  id="subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setFieldValue("subject", e.target.value)}
                  disabled={submitting}
                />
                {errors.subject ? <span className={styles.errorText}>{errors.subject}</span> : null}
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  rows="6"
                  placeholder="Describe the issue in detail, including any booking IDs, dates, or steps that help us reproduce it."
                  value={form.description}
                  onChange={(e) => setFieldValue("description", e.target.value)}
                  disabled={submitting}
                />
                {errors.description ? <span className={styles.errorText}>{errors.description}</span> : null}
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <div className={styles.attachmentsHeader}>
                  <label htmlFor="attachments">Attachments</label>
                  <span className={styles.attachmentHint}>Up to 5 files</span>
                </div>

                <label htmlFor="attachments" className={styles.filePicker}>
                  <Paperclip size={16} />
                  <span>{form.attachments.length > 0 ? "Add more files" : "Choose files"}</span>
                </label>
                <input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleAttachmentSelect}
                  disabled={submitting || form.attachments.length >= 5}
                  className={styles.hiddenFileInput}
                />

                <div className={styles.attachmentsList}>
                  {form.attachments.length > 0 ? form.attachments.map((attachment, index) => (
                    <div key={`${attachment.name}-${index}`} className={styles.attachmentRow}>
                      <div className={styles.attachmentMeta}>
                        <strong>{attachment.name}</strong>
                        <span>{Math.max(1, Math.round(attachment.size / 1024))} KB</span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeAttachmentButton}
                        onClick={() => handleRemoveAttachment(index)}
                        disabled={submitting}
                        aria-label={`Remove attachment ${index + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )) : (
                    <div className={styles.emptyAttachments}>No files selected yet.</div>
                  )}
                </div>
                {errors.attachments ? <span className={styles.errorText}>{errors.attachments}</span> : null}
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? "Submitting ticket..." : "Submit support ticket"}
            </button>
          </form>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.sideCard}>
            <h3>Need direct support?</h3>
            <p>Our team can also help through the support contacts below while your ticket is being reviewed.</p>
            <div className={styles.contactList}>
              {contacts.length > 0 ? contacts.map((contact) => (
                <div key={contact.supportContactId || contact.email || contact.phoneNumber} className={styles.contactCard}>
                  <strong>{contact.name || "Support Team"}</strong>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`}>
                      <Mail size={14} />
                      <span>{contact.email}</span>
                    </a>
                  ) : null}
                  {contact.phoneNumber ? (
                    <a href={`tel:${contact.phoneNumber}`}>
                      <Phone size={14} />
                      <span>{contact.phoneNumber}</span>
                    </a>
                  ) : null}
                </div>
              )) : (
                <div className={styles.mutedBox}>Support contact details will appear here when available.</div>
              )}
            </div>
          </div>

          <div className={styles.sideCard}>
            <h3>Before you submit</h3>
            <ul className={styles.tipList}>
              <li>Include the booking, order, or listing reference if you have one.</li>
              <li>Describe what happened and what you expected to happen.</li>
              <li>Add links to screenshots or documents if they help explain the issue.</li>
            </ul>
          </div>

          <div className={styles.sideCard}>
            <h3>Popular FAQ topics</h3>
            {faqs.length > 0 ? (
              <div className={styles.faqPreviewList}>
                {faqs.slice(0, 3).map((faq) => (
                  <div key={faq.supportFaqId} className={styles.faqPreviewItem}>
                    <strong>{faq.question}</strong>
                    <span>{faq.answer}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.mutedBox}>FAQ content is not available right now.</div>
            )}
          </div>
        </aside>
      </div>
      ) : null}

      {showTicketsTab && activeTab === "tickets" ? (
        <section className={styles.ticketsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Track your existing support requests</h2>
              <p className={styles.sectionSubtitle}>
                View ticket status, follow the support timeline, and download files shared for a ticket.
              </p>
            </div>
          </div>

          <div className={styles.ticketHub}>
            <div className={styles.ticketListCard}>
              <div className={styles.ticketListHeader}>
                <h3>Your tickets</h3>
                <span>{sortedTickets.length} total</span>
              </div>

              {ticketsLoading ? (
                <div className={styles.stateBox}>Loading your tickets...</div>
              ) : ticketsError ? (
                <div className={styles.errorPanel}>{ticketsError}</div>
              ) : sortedTickets.length === 0 ? (
                <div className={styles.stateBox}>No tickets yet. The tickets you create here will appear in this list.</div>
              ) : (
                <div className={styles.ticketList}>
                  {sortedTickets.map((ticket) => (
                    <button
                      key={ticket.ticketId}
                      type="button"
                      className={`${styles.ticketListItem} ${String(selectedTicketId) === String(ticket.ticketId) ? styles.ticketListItemActive : ""}`}
                      onClick={() => setSelectedTicketId(ticket.ticketId)}
                    >
                      <div className={styles.ticketListTop}>
                        <strong>{ticket.subject}</strong>
                        <span className={`${styles.statusBadge} ${getStatusTone(ticket.status)}`}>{ticket.status}</span>
                      </div>
                      <div className={styles.ticketListMeta}>
                        <span><Ticket size={14} /> {ticket.ticketId}</span>
                        <span><Clock3 size={14} /> Created {formatDate(ticket.createdAt)}</span>
                      </div>
                      <div className={styles.ticketListCategory}>{ticket.issueCategory}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.ticketDetailCard}>
              {!selectedTicketId ? (
                <div className={styles.stateBox}>Select a ticket to view its full timeline and attachments.</div>
              ) : ticketDetailLoading ? (
                <div className={styles.stateBox}>Loading ticket details...</div>
              ) : ticketDetailError ? (
                <div className={styles.errorPanel}>{ticketDetailError}</div>
              ) : !detailTicket ? (
                <div className={styles.stateBox}>Ticket details are not available right now.</div>
              ) : (
                <>
                  <div className={styles.ticketDetailHeader}>
                    <div>
                      <div className={styles.ticketMetaRow}>
                        <span className={styles.ticketIdentifier}>{detailTicket.ticketId}</span>
                        <span className={`${styles.statusBadge} ${getStatusTone(detailTicket.status)}`}>{detailTicket.status}</span>
                      </div>
                      <h3>{detailTicket.subject}</h3>
                      <div className={styles.ticketContextRow}>
                        <span>{detailTicket.issueCategory || "—"}</span>
                        {detailTicket.customIssueText ? <span>{detailTicket.customIssueText}</span> : null}
                      </div>
                      <div className={styles.ticketCreatedRow}>Created {formatDate(detailTicket.createdAt)}</div>
                      <p>{detailTicket.description}</p>
                    </div>
                  </div>

<div className={styles.ticketSummaryGrid}>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Customer</span>
                      <strong>{detailTicket.customerName || "—"}</strong>
                      <span>{detailTicket.customerCountryCode || ""} {detailTicket.customerPhone || ""}</span>
                      <span>{detailTicket.customerEmail || "No email provided"}</span>
                    </div>
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryLabel}>Assigned To</span>
                      <strong>{detailTicket.assignedEmployeeName || "Not assigned yet"}</strong>
                      <span>{detailTicket.assignedEmployeeEmail || "The support team will pick this up soon."}</span>
                    </div>
                  </div>

                  <div className={styles.detailColumns}>
                    <div className={styles.detailPanel}>
                      <div className={styles.detailPanelHeader}>
                        <h4>Timeline</h4>
                        <span>{detailMessages.length} updates</span>
                      </div>
                      {detailMessages.length > 0 ? (
                        <div className={styles.timeline}>
                          {detailMessages.map((message) => (
                            <div key={message.supportTicketMessageId} className={styles.timelineItem}>
                              <div className={styles.timelineDot} />
                              <div className={styles.timelineCard}>
                                <div className={styles.timelineHeader}>
                                  <strong>{message.senderName || message.employeeFirstName || "Support"}</strong>
                                  <span>{formatDateTime(message.createdAt)}</span>
                                </div>
                                <div className={styles.timelineTag}>
                                  {message.senderType === "employee" ? <User size={13} /> : <ShieldAlert size={13} />}
                                  <span>{String(message.senderType || "system").toUpperCase()}</span>
                                </div>
                                <p>{message.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.stateBox}>No timeline messages are available for this ticket yet.</div>
                      )}
                    </div>

                    <div className={styles.detailPanel}>
                      <div className={styles.detailPanelHeader}>
                        <h4>Attachments</h4>
                        <span>{detailAttachments.length} files</span>
                      </div>
                      {downloadError ? <div className={styles.inlineError}>{downloadError}</div> : null}
                      {detailAttachments.length > 0 ? (
                        <div className={styles.attachmentDownloadList}>
                          {detailAttachments.map((attachment) => (
                            <div key={attachment.supportTicketAttachmentId} className={styles.downloadRow}>
                              <div className={styles.downloadMeta}>
                                <strong title={attachment.fileName || "Attachment"}>
                                  {getCompactFileName(attachment.fileName)}
                                </strong>
                                <span>{formatFileSize(attachment.fileSize)} • {attachment.mimeType || "Unknown type"}</span>
                                <span>{formatDateTime(attachment.createdAt)}</span>
                              </div>
                              <button
                                type="button"
                                className={styles.downloadButton}
                                onClick={() => handleAttachmentDownload(detailTicket.ticketId, attachment)}
                                disabled={downloadingAttachmentId === attachment.supportTicketAttachmentId}
                              >
                                <Download size={14} />
                                {downloadingAttachmentId === attachment.supportTicketAttachmentId ? "Downloading..." : "Download"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.stateBox}>No attachments are available for this ticket.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Support;
