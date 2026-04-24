# Ticket Management - Code Changes Summary

## Backend Changes

### 1. NEW FILE: TicketCommentDTO.java
**Location:** `backend/src/main/java/com/northbridge/backend/dto/TicketCommentDTO.java`

```java
public class TicketCommentDTO {
    private Long id;
    private Long ticketId;
    private String userName;
    private String commentText;
    private LocalDateTime createdAt;
    
    // Constructor, getters, setters
}
```

**Purpose:** Serializes ticket comments in API responses

---

### 2. MODIFIED: TicketResponseDTO.java
**Location:** `backend/src/main/java/com/northbridge/backend/dto/TicketResponseDTO.java`

**Changes:**
```java
// ADDED FIELD
private List<TicketCommentDTO> comments;

// ADDED GETTER
public List<TicketCommentDTO> getComments() {
    return comments;
}

// ADDED SETTER
public void setComments(List<TicketCommentDTO> comments) {
    this.comments = comments;
}
```

**Impact:** API response now includes comments array

---

### 3. MODIFIED: TicketService.java
**Location:** `backend/src/main/java/com/northbridge/backend/service/TicketService.java`

**Method:** `convertToDTO(IncidentTicket ticket)`

**Added Logic:**
```java
// Add comments
List<com.northbridge.backend.dto.TicketCommentDTO> commentDTOs = new ArrayList<>();
if (ticket.getComments() != null) {
    commentDTOs = ticket.getComments().stream()
            .map(c -> new com.northbridge.backend.dto.TicketCommentDTO(
                    c.getId(),
                    ticket.getId(),
                    c.getUser() != null ? c.getUser().getName() : "Unknown",
                    c.getCommentText(),
                    c.getCreatedAt()
            ))
            .collect(Collectors.toList());
}
dto.setComments(commentDTOs);
```

**Impact:** Comments are now included in every ticket response

---

## Frontend Changes

### MODIFIED: TicketDetails.tsx
**Location:** `frontend/src/app/client/tickets/TicketDetails.tsx`

#### Change 1: Updated Ticket Interface

**BEFORE:**
```typescript
interface Ticket {
  id: number;
  category: string;
  description: string;
  status: string;
  priority: string;
  resourceId: number;
  preferredContact: string;
  createdAt: string;
  attachments?: Array<{ id: number; fileName: string; url: string }>;
  comments?: Array<{
    id: number;
    content: string;        // WRONG
    createdBy: string;      // WRONG
    createdAt: string;
  }>;
}
```

**AFTER:**
```typescript
interface Ticket {
  id: number;
  category: string;
  description: string;
  status: string;
  priority: string;
  resourceId: number;
  resourceName?: string;                           // ADDED
  createdByName?: string;                          // ADDED
  assignedToName?: string;                         // ADDED
  preferredContact: string;
  createdAt: string;
  rejectionReason?: string;                        // ADDED
  resolutionNotes?: string;                        // ADDED
  attachmentUrls?: string[];                       // CHANGED
  comments?: Array<{
    id: number;
    commentText: string;   // FIXED
    userName: string;      // FIXED
    createdAt: string;
  }>;
}
```

---

#### Change 2: Fixed Data Loading

**BEFORE:**
```typescript
const loadTicket = async () => {
  try {
    setLoading(true);
    const res = await getTicketById(Number(id));
    console.log("API RESPONSE:", res);
    console.log("DATA:", res.data);
    setTicket(res.data.data || res.data);  // WRONG: Double nesting
  } catch (err: any) {
    setError(err?.response?.data?.message || "Failed to load ticket details");
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

**AFTER:**
```typescript
const loadTicket = async () => {
  try {
    setLoading(true);
    setError("");
    const res = await getTicketById(Number(id));
    
    if (!res.data) {
      setError("No ticket data received from server");
      return;
    }
    
    setTicket(res.data);  // FIXED: Direct assignment
  } catch (err: any) {
    const errorMessage = 
      err?.response?.status === 404 ? "Ticket not found" :
      err?.response?.data?.message || 
      err?.message ||
      "Failed to load ticket details";
    setError(errorMessage);
    console.error("Error loading ticket:", err);
  } finally {
    setLoading(false);
  }
};
```

---

#### Change 3: Enhanced Comment Handler

**BEFORE:**
```typescript
const handleAddComment = useCallback(async () => {
  if (!comment.trim()) {
    setCommentError("Comment cannot be empty");
    return;
  }

  try {
    setCommentLoading(true);
    setCommentError("");
    setCommentSuccess("");
    await addComment(Number(id), comment);

    const res = await getTicketById(Number(id));
    setTicket(res.data);
    setComment("");
    setCommentSuccess("Comment posted successfully!");
    
    setTimeout(() => {
      setCommentSuccess("");
    }, 3000);
  } catch (err: any) {
    setCommentError(
      err?.response?.data?.message || "Failed to add comment"
    );
    console.error(err);
  } finally {
    setCommentLoading(false);
  }
}, [comment, id]);
```

**AFTER:**
```typescript
const handleAddComment = useCallback(async () => {
  // ADDED: Multiple validations
  if (!comment || !comment.trim()) {
    setCommentError("Comment cannot be empty");
    return;
  }

  if (comment.trim().length < 2) {
    setCommentError("Comment must be at least 2 characters");
    return;
  }

  if (comment.trim().length > 2000) {
    setCommentError("Comment cannot exceed 2000 characters");
    return;
  }

  try {
    setCommentLoading(true);
    setCommentError("");
    setCommentSuccess("");
    
    await addComment(Number(id), comment.trim());

    // IMPROVED: Better error handling with fallback
    try {
      const res = await getTicketById(Number(id));
      setTicket(res.data);
      setComment("");
      setCommentSuccess("Comment posted successfully!");
      
      setTimeout(() => {
        setCommentSuccess("");
      }, 3000);
    } catch (reloadErr: any) {
      console.error("Failed to reload ticket after comment:", reloadErr);
      setComment("");
      setCommentSuccess("Comment posted! (refresh to see updates)");
      setTimeout(() => {
        setCommentSuccess("");
      }, 3000);
    }
  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to add comment";
    setCommentError(errorMessage);
    console.error("Error adding comment:", err);
  } finally {
    setCommentLoading(false);
  }
}, [comment, id]);
```

---

#### Change 4: Fixed Attachments Rendering

**BEFORE:**
```typescript
{ticket.attachments && ticket.attachments.length > 0 && (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-4">
      Attachments ({ticket.attachments.length})
    </h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {ticket.attachments.map((attachment) => (
        <div key={attachment.id} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 aspect-square">
          <img src={attachment.url} alt={attachment.fileName} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </div>
      ))}
    </div>
  </div>
)}
```

**AFTER:**
```typescript
{ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-4">
      Attachments ({ticket.attachmentUrls.length})
    </h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {ticket.attachmentUrls.map((url, index) => (
        <div key={index} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 aspect-square">
          <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </div>
      ))}
    </div>
  </div>
)}
```

---

#### Change 5: Fixed Comment Rendering

**BEFORE:**
```typescript
{ticket.comments && ticket.comments.length > 0 ? (
  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
    {ticket.comments.map((com) => (
      <div key={com.id} className="rounded-lg bg-slate-50 p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-slate-900">{com.createdBy}</p>  {/* WRONG */}
          <p className="text-xs text-slate-500">
            {new Date(com.createdAt).toLocaleDateString()} at{" "}
            {new Date(com.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <p className="text-slate-700">{com.content}</p>  {/* WRONG */}
      </div>
    ))}
  </div>
) : (
  <p className="text-slate-500 text-center py-6 mb-6">No comments yet</p>
)}
```

**AFTER:**
```typescript
{ticket.comments && ticket.comments.length > 0 ? (
  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
    {ticket.comments.map((com) => (
      <div key={com.id} className="rounded-lg bg-slate-50 p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-slate-900">{com.userName}</p>  {/* FIXED */}
          <p className="text-xs text-slate-500">
            {new Date(com.createdAt).toLocaleDateString()} at{" "}
            {new Date(com.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <p className="text-slate-700">{com.commentText}</p>  {/* FIXED */}
      </div>
    ))}
  </div>
) : (
  <p className="text-slate-500 text-center py-6 mb-6">No comments yet</p>
)}
```

---

#### Change 6: Enhanced Comment Form

**BEFORE:**
```typescript
<div className="border-t border-slate-200 pt-6">
  <label className="block text-sm font-semibold text-slate-900 mb-3">
    Add a Comment
  </label>
  <div className="flex flex-col gap-3">
    <textarea
      value={comment}
      onChange={(e) => {
        setComment(e.target.value);
        setCommentError("");
        setCommentSuccess("");
      }}
      placeholder="Share an update or question about this ticket..."
      rows={4}
      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
    />
    {commentError && (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-600">{commentError}</p>
      </div>
    )}
    {commentSuccess && (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-600">{commentSuccess}</p>
      </div>
    )}
    <button
      onClick={handleAddComment}
      disabled={commentLoading || !comment.trim()}
      className="flex items-center justify-center gap-2 rounded-lg bg-[#002147] px-6 py-2.5 text-white font-semibold hover:bg-[#001733] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Send className="w-4 h-4" />
      {commentLoading ? "Posting..." : "Post Comment"}
    </button>
  </div>
</div>
```

**AFTER:**
```typescript
<div className="border-t border-slate-200 pt-6">
  <label className="block text-sm font-semibold text-slate-900 mb-3">
    Add a Comment
  </label>
  <div className="flex flex-col gap-3">
    <textarea
      value={comment}
      onChange={(e) => {
        setComment(e.target.value);
        setCommentError("");
      }}
      placeholder="Share an update or question about this ticket... (min 2 characters)"  {/* UPDATED */}
      rows={4}
      maxLength={2000}  {/* ADDED */}
      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
    />
    {/* ADDED: Character counter */}
    <div className="flex justify-between">
      <div />
      <p className="text-xs text-slate-500">
        {comment.length}/2000 characters
      </p>
    </div>
    {commentError && (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2">  {/* FIXED: gap-2 */}
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-600">{commentError}</p>
      </div>
    )}
    {commentSuccess && (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex gap-2">  {/* FIXED: gap-2 */}
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-600">{commentSuccess}</p>
      </div>
    )}
    <button
      onClick={handleAddComment}
      disabled={commentLoading || !comment.trim() || comment.trim().length < 2}  {/* UPDATED: Added min length check */}
      className="flex items-center justify-center gap-2 rounded-lg bg-[#002147] px-6 py-2.5 text-white font-semibold hover:bg-[#001733] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Send className="w-4 h-4" />
      {commentLoading ? "Posting..." : "Post Comment"}
    </button>
  </div>
</div>
```

---

## Summary of Changes

| File | Type | Changes | Lines |
|------|------|---------|-------|
| TicketCommentDTO.java | NEW | Created DTO for comments | ~55 |
| TicketResponseDTO.java | MODIFIED | Added comments field + getter/setter | +8 |
| TicketService.java | MODIFIED | Updated convertToDTO() method | +18 |
| TicketDetails.tsx | MODIFIED | Fixed interface, error handling, validation | ~50 |
| **TOTAL** | | | **~131 lines** |

**Compilation Status:**
- ✅ Backend: BUILD SUCCESS
- ✅ Frontend: BUILD SUCCESS

