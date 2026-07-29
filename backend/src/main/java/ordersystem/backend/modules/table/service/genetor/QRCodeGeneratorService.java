package ordersystem.backend.modules.table.service.genetor;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

// === IMPORT CHUẨN CỦA OPENPDF ===
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfWriter;

import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.enums.QRFormat;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

@Component
public class QRCodeGeneratorService {

    // === CÁC HẰNG SỐ CẤU HÌNH (TRÁNH MAGIC NUMBERS) ===
    private static final int DEFAULT_QR_WIDTH = 300;
    private static final int DEFAULT_QR_HEIGHT = 300;
    private static final int PDF_QR_SIZE = 250;

    /**
     * Phương thức điều phối chính (Main Dispatcher Endpoint).
     * Tự động điều hướng sinh file PNG hoặc PDF dựa theo enum QrFormat.
     */
    public QRCodeExportResponse generate(String tableName, String qrUrl, QRFormat format) {
        String sanitizedName = sanitizeFileName(tableName);
        if (format == QRFormat.PNG) {
            byte[] pngData = generatePng(qrUrl, DEFAULT_QR_WIDTH, DEFAULT_QR_HEIGHT);
            return QRCodeExportResponse.builder()
                    .data(pngData)
                    .fileName("QR_" + sanitizedName + ".png")
                    .contentType("image/png")
                    .build();
        }
        // Mặc định xuất PDF
        byte[] pdfData = generatePdf(tableName, qrUrl);
        return QRCodeExportResponse.builder()
                .data(pdfData)
                .fileName("QR_" + sanitizedName + ".pdf")
                .contentType("application/pdf")
                .build();
    }

    /**
     * Sinh Byte Array cho ảnh PNG từ chuỗi QR URL.
     */
    public byte[] generatePng(String qrUrl, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrUrl, BarcodeFormat.QR_CODE, width, height);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new QrGenerationException("Failed to generate PNG QR Code image", e);
        }
    }

    /**
     * Sinh Byte Array cho file PDF (Khổ A6) đã hỗ trợ Tiếng Việt Unicode.
     */
    public byte[] generatePdf(String tableName, String qrUrl) {
        // Sử dụng try-with-resources để tự động đóng ByteArrayOutputStream
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Document document = new Document(PageSize.A6, 20, 20, 20, 20); // Margins: Left, Right, Top, Bottom
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // 1. Cấu hình Font Tiếng Việt Unicode
            Font titleFont = getVietnameseFont(16, Font.BOLD);
            Font subFont = getVietnameseFont(10, Font.NORMAL);

            // 2. Tiêu đề Tên Bàn
            Paragraph title = new Paragraph(tableName.toUpperCase(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            // 3. Tạo & Chèn ảnh QR Code vào PDF
            byte[] qrBytes = generatePng(qrUrl, PDF_QR_SIZE, PDF_QR_SIZE);
            Image qrImage = Image.getInstance(qrBytes);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            document.add(qrImage);

            // 4. Đoạn văn hướng dẫn bên dưới
            Paragraph sub = new Paragraph("Quét mã QR để xem Thực đơn & Đặt món", subFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingBefore(10);
            document.add(sub);

            document.close();
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new QrGenerationException("Failed to generate QR Code for " + tableName, e);
        }
    }

    /**
     * Helper hỗ trợ Font Tiếng Việt hiển thị chuẩn Unicode trong OpenPDF.
     */
    private Font getVietnameseFont(float size, int style) {
        try {
            // Dùng BaseFont Identity-H để hỗ trợ Tiếng Việt UTF-8 chuẩn
            BaseFont baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            return new Font(baseFont, size, style);
        } catch (Exception e) {
            // Fallback nếu môi trường không load được BaseFont
            return FontFactory.getFont(FontFactory.HELVETICA, size, style);
        }
    }

    /**
     * Lọc ký tự đặc biệt để tạo tên file an toàn (VD: "Bàn 05" -> "Ban_05").
     */
    private String sanitizeFileName(String tableName) {
        if (tableName == null) return "Unknown";
        return tableName.trim().replaceAll("[^a-zA-Z0-9]", "_");
    }

    /**
     * Inner Custom Exception giúp Layer Service/Controller dễ bắt lỗi chính xác.
     */
    public static class QrGenerationException extends RuntimeException {
        public QrGenerationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}