package ordersystem.backend.modules.table.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;

@Getter
@RequiredArgsConstructor
public enum QrFormat {
    PDF("pdf", MediaType.APPLICATION_PDF, ".pdf"),
    PNG("png", MediaType.IMAGE_PNG, ".png");

    private final String value;
    private final MediaType mediaType;
    private final String fileExtension;

    public static QrFormat fromString(String format) {
        if (format == null) {
            return PDF;
        }
        for (QrFormat f : QrFormat.values()) {
            if (f.value.equalsIgnoreCase(format)) {
                return f;
            }
        }
        return PDF; // Mặc định trả về PDF nếu truyền tham số không hợp lệ
    }
}
