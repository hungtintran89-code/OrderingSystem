package ordersystem.backend.modules.table.service.impl;


public interface QRCodeGeneratorService {

    //Vẽ mã QR dạng byte array (PNG).
    byte[] generatorQRCodeImage(String text, int width, int height);

    //Tạo trang PDF đẹp mắt có Logo + Tên Bàn + Mã QR để đưa đi in.
    byte[] generateQRCodePDF(String tableName, String qrUrl);
}
