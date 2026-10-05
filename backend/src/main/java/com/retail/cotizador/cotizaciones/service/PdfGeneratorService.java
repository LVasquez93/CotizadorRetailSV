package com.retail.cotizador.cotizaciones.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.retail.cotizador.cotizaciones.entity.Cotizacion;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PdfGeneratorService {

    private final TemplateEngine templateEngine;

    public byte[] generarCotizacionPdf(Cotizacion cotizacion) {
        Context context = new Context(new Locale("es", "SV"));
        context.setVariable("c", cotizacion);
        context.setVariable("signatureBase64", imageToBase64("templates/assets/signature-erick-ramirez.jpeg"));

        String baseUri = getTemplatesBaseUri();
        String htmlContent = templateEngine.process("cotizacion-template", context);

        byte[] rawPdfBytes;
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, baseUri);
            builder.toStream(outputStream);
            builder.run();
            rawPdfBytes = outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al compilar el PDF de la cotización: " + e.getMessage(), e);
        }

        return estamparBannersEnTodasLasPaginas(rawPdfBytes);
    }

    private byte[] estamparBannersEnTodasLasPaginas(byte[] pdfBytes) {
        byte[] headerBytes = loadResourceBytes("templates/assets/header-banner.jpeg");
        byte[] footerBytes = loadResourceBytes("templates/assets/footer-banner.jpeg");

        if (headerBytes == null || footerBytes == null) {
            return pdfBytes;
        }

        try (PDDocument document = PDDocument.load(pdfBytes);
             ByteArrayOutputStream finalOut = new ByteArrayOutputStream()) {

            PDImageXObject headerImage = PDImageXObject.createFromByteArray(document, headerBytes, "header");
            PDImageXObject footerImage = PDImageXObject.createFromByteArray(document, footerBytes, "footer");

            for (PDPage page : document.getPages()) {
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                float headerHeight = pageWidth * headerImage.getHeight() / (float) headerImage.getWidth();
                float footerHeight = pageWidth * footerImage.getHeight() / (float) footerImage.getWidth();

                try (PDPageContentStream contentStream = new PDPageContentStream(
                        document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    // Cintillo superior en el tope exacto de la página
                    contentStream.drawImage(headerImage, 0, pageHeight - headerHeight, pageWidth, headerHeight);

                    // Cintillo inferior en la base exacta de la página
                    contentStream.drawImage(footerImage, 0, 0, pageWidth, footerHeight);
                }
            }

            document.save(finalOut);
            return finalOut.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al estampar cintillos corporativos en el PDF: " + e.getMessage(), e);
        }
    }

    private String getTemplatesBaseUri() {
        try {
            return new ClassPathResource("templates/").getURL().toExternalForm();
        } catch (Exception e) {
            return new java.io.File("src/main/resources/templates/").toURI().toString();
        }
    }

    private byte[] loadResourceBytes(String classpathLocation) {
        try {
            return new ClassPathResource(classpathLocation).getInputStream().readAllBytes();
        } catch (IOException e) {
            return null;
        }
    }

    private String imageToBase64(String classpathLocation) {
        try {
            byte[] bytes = new ClassPathResource(classpathLocation).getInputStream().readAllBytes();
            return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            return "";
        }
    }
}
