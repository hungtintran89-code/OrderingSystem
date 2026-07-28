package ordersystem.backend.modules.table.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;

@Getter
@RequiredArgsConstructor
public enum QRFormat {
    PDF("pdf", MediaType.APPLICATION_PDF, ".pdf"),
    PNG("png", MediaType.IMAGE_PNG, ".png");

    private final String value;
    private final MediaType mediaType;
    private final String fileExtension;

    public static QRFormat fromString(String format) {
        if (format == null) {
            return PDF;
        }
        for (QRFormat f : QRFormat.values()) {
            if (f.value.equalsIgnoreCase(format)) {
                return f;
            }
        }
        return PDF; // Mặc định trả về PDF nếu truyền tham số không hợp lệ
    }
}
