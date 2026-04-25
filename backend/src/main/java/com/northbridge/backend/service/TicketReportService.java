package com.northbridge.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.northbridge.backend.dto.TicketReportFilterDTO;
import com.northbridge.backend.dto.TicketReportRowDTO;
import com.northbridge.backend.model.IncidentTicket;
import com.northbridge.backend.repository.TicketRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class TicketReportService {
    private static final String ORG_NAME = "Northbridge University";
    private static final String REPORT_TITLE = "Ticket History Report";
    private static final int MAX_ROWS = 5000;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TicketRepository ticketRepository;

    public TicketReportService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public byte[] generateReportPdf(TicketReportFilterDTO filter) {
        validateFilter(filter);

        List<IncidentTicket> tickets = ticketRepository.findAll(buildSpec(filter), Sort.by(Sort.Direction.DESC, "createdAt"));
        boolean truncated = false;
        if (tickets.size() > MAX_ROWS) {
            tickets = tickets.subList(0, MAX_ROWS);
            truncated = true;
        }

        List<TicketReportRowDTO> rows = tickets.stream().map(this::toRowDto).toList();
        return buildPdf(rows, filter, truncated);
    }

    private void validateFilter(TicketReportFilterDTO filter) {
        if (filter == null) {
            throw new IllegalArgumentException("Filter is required");
        }
        LocalDate from = filter.getFromDate();
        LocalDate to = filter.getToDate();
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }

        if (filter.getStatus() != null && !filter.getStatus().trim().isEmpty()) {
            String s = filter.getStatus().trim().toUpperCase(Locale.ROOT);
            if (!isAllowed(s, List.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"))) {
                throw new IllegalArgumentException("Invalid status. Allowed values: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED");
            }
            filter.setStatus(s);
        }

        if (filter.getPriority() != null && !filter.getPriority().trim().isEmpty()) {
            String p = filter.getPriority().trim().toUpperCase(Locale.ROOT);
            if (!isAllowed(p, List.of("LOW", "MEDIUM", "HIGH"))) {
                throw new IllegalArgumentException("Invalid priority. Allowed values: LOW, MEDIUM, HIGH");
            }
            filter.setPriority(p);
        }

        if (filter.getSearch() != null) {
            String s = filter.getSearch().trim();
            filter.setSearch(s.isEmpty() ? null : s);
        }

        if (filter.getAssignedTo() != null && filter.getAssignedTo() <= 0) {
            throw new IllegalArgumentException("assignedTo must be a positive id");
        }
    }

    private boolean isAllowed(String value, List<String> allowed) {
        for (String a : allowed) {
            if (Objects.equals(a, value)) return true;
        }
        return false;
    }

    @NonNull
    private Specification<IncidentTicket> buildSpec(TicketReportFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                LocalDateTime from = filter.getFromDate().atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (filter.getToDate() != null) {
                LocalDateTime to = filter.getToDate().plusDays(1).atStartOfDay();
                predicates.add(cb.lessThan(root.get("createdAt"), to));
            }

            if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), filter.getStatus()));
            }

            if (filter.getPriority() != null && !filter.getPriority().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("priority")), filter.getPriority()));
            }

            if (filter.getAssignedTo() != null) {
                predicates.add(cb.equal(root.get("assignedStaffId"), filter.getAssignedTo()));
            }

            if (filter.getSearch() != null && !filter.getSearch().isEmpty()) {
                String like = "%" + filter.getSearch().toLowerCase(Locale.ROOT) + "%";
                Expression<String> category = cb.lower(root.get("category"));
                Expression<String> description = cb.lower(root.get("description"));
                predicates.add(cb.or(cb.like(category, like), cb.like(description, like)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private TicketReportRowDTO toRowDto(IncidentTicket t) {
        TicketReportRowDTO dto = new TicketReportRowDTO();
        dto.setTicketId(t.getId());
        dto.setTitle(safeTitle(t.getCategory(), t.getDescription()));
        dto.setStatus(t.getStatus());
        dto.setPriority(t.getPriority());
        dto.setAssignedStaff(t.getAssignedStaffName() != null && !t.getAssignedStaffName().trim().isEmpty()
                ? t.getAssignedStaffName()
                : "Unassigned");
        dto.setCreatedDate(t.getCreatedAt());
        dto.setClosedDate("CLOSED".equalsIgnoreCase(t.getStatus()) ? t.getUpdatedAt() : null);
        return dto;
    }

    private String safeTitle(String category, String description) {
        String cat = category == null ? "" : category.trim();
        if (!cat.isEmpty()) return cat;
        String d = description == null ? "" : description.trim();
        if (d.isEmpty()) return "N/A";
        return d.length() > 60 ? d.substring(0, 57) + "..." : d;
    }

    private byte[] buildPdf(List<TicketReportRowDTO> rows, TicketReportFilterDTO filter, boolean truncated) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 80, 48);
        PdfWriter writer = PdfWriter.getInstance(document, out);

        PdfReportPageEvent event = new PdfReportPageEvent();
        writer.setPageEvent(event);

        document.open();

        com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(0, 33, 71));
        com.lowagie.text.Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);

        Paragraph org = new Paragraph(ORG_NAME, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(0, 33, 71)));
        org.setSpacingAfter(4);
        document.add(org);

        Paragraph title = new Paragraph(REPORT_TITLE, titleFont);
        title.setSpacingAfter(6);
        document.add(title);

        Paragraph generated = new Paragraph("Generated: " + LocalDateTime.now().format(DATE_TIME), subFont);
        generated.setSpacingAfter(10);
        document.add(generated);

        document.add(buildFiltersSummary(filter, truncated));

        if (rows.isEmpty()) {
            Paragraph empty = new Paragraph("No tickets matched the selected filters.", FontFactory.getFont(FontFactory.HELVETICA, 11));
            empty.setSpacingBefore(12);
            document.add(empty);
            document.close();
            return out.toByteArray();
        }

        PdfPTable table = new PdfPTable(new float[]{1.0f, 3.2f, 1.5f, 1.4f, 2.2f, 2.0f, 2.0f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(8);

        addHeaderCell(table, "Ticket ID");
        addHeaderCell(table, "Title");
        addHeaderCell(table, "Status");
        addHeaderCell(table, "Priority");
        addHeaderCell(table, "Assigned Staff");
        addHeaderCell(table, "Created Date");
        addHeaderCell(table, "Closed Date");

        com.lowagie.text.Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
        Color zebra = new Color(245, 247, 250);

        for (int i = 0; i < rows.size(); i++) {
            TicketReportRowDTO r = rows.get(i);
            Color bg = (i % 2 == 0) ? Color.WHITE : zebra;
            addBodyCell(table, String.valueOf(r.getTicketId()), cellFont, bg);
            addBodyCell(table, nullToDash(r.getTitle()), cellFont, bg);
            addBodyCell(table, nullToDash(r.getStatus()), cellFont, bg);
            addBodyCell(table, nullToDash(r.getPriority()), cellFont, bg);
            addBodyCell(table, nullToDash(r.getAssignedStaff()), cellFont, bg);
            addBodyCell(table, r.getCreatedDate() != null ? r.getCreatedDate().format(DATE_TIME) : "-", cellFont, bg);
            addBodyCell(table, r.getClosedDate() != null ? r.getClosedDate().format(DATE_TIME) : "-", cellFont, bg);
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }

    private String nullToDash(String s) {
        if (s == null) return "-";
        String v = s.trim();
        return v.isEmpty() ? "-" : v;
    }

    private Element buildFiltersSummary(TicketReportFilterDTO filter, boolean truncated) {
        com.lowagie.text.Font label = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(55, 65, 81));
        com.lowagie.text.Font value = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(55, 65, 81));

        PdfPTable box = new PdfPTable(new float[]{1.2f, 3.8f});
        box.setWidthPercentage(100);
        box.setSpacingAfter(6);

        addSummaryRow(box, label, value, "Date range", formatRange(filter.getFromDate(), filter.getToDate()));
        addSummaryRow(box, label, value, "Status", filter.getStatus() == null ? "All" : filter.getStatus());
        addSummaryRow(box, label, value, "Priority", filter.getPriority() == null ? "All" : filter.getPriority());
        addSummaryRow(box, label, value, "Assigned staff", filter.getAssignedTo() == null ? "Any" : String.valueOf(filter.getAssignedTo()));
        addSummaryRow(box, label, value, "Keyword", filter.getSearch() == null ? "None" : filter.getSearch());

        if (truncated) {
            PdfPCell warn = new PdfPCell(new Phrase("Note: Large result set. Report was limited to first " + MAX_ROWS + " tickets.", value));
            warn.setColspan(2);
            warn.setPadding(8);
            warn.setBackgroundColor(new Color(255, 251, 235));
            warn.setBorderColor(new Color(251, 191, 36));
            box.addCell(warn);
        }

        PdfPCell outer = new PdfPCell(box);
        outer.setBorderColor(new Color(226, 232, 240));
        outer.setPadding(0);
        PdfPTable wrapper = new PdfPTable(1);
        wrapper.setWidthPercentage(100);
        wrapper.addCell(outer);
        return wrapper;
    }

    private void addSummaryRow(PdfPTable t, Font label, Font value, String k, String v) {
        PdfPCell c1 = new PdfPCell(new Phrase(k, label));
        c1.setPadding(6);
        c1.setBorderColor(new Color(226, 232, 240));
        c1.setBackgroundColor(new Color(248, 250, 252));
        t.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(v, value));
        c2.setPadding(6);
        c2.setBorderColor(new Color(226, 232, 240));
        t.addCell(c2);
    }

    private String formatRange(LocalDate from, LocalDate to) {
        if (from == null && to == null) return "All time";
        if (from != null && to == null) return from.format(DATE) + " to ...";
        if (from == null) return "... to " + to.format(DATE);
        return from.format(DATE) + " to " + to.format(DATE);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        com.lowagie.text.Font head = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        PdfPCell cell = new PdfPCell(new Phrase(text, head));
        cell.setBackgroundColor(new Color(0, 33, 71));
        cell.setPadding(7);
        cell.setBorderColor(new Color(203, 213, 225));
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, com.lowagie.text.Font font, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private static class PdfReportPageEvent extends PdfPageEventHelper {
        private final com.lowagie.text.Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(100, 116, 139));

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            int page = writer.getPageNumber();

            String left = "Generated by Ticket Management System";
            String right = "Page " + page;

            float y = document.bottom() - 18;
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase(left, footerFont), document.left(), y, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(right, footerFont), document.right(), y, 0);
        }
    }
}

