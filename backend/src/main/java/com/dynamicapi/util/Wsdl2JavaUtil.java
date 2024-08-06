package com.dynamicapi.util;

import com.dynamicapi.exception.WebserviceException;
import lombok.extern.slf4j.Slf4j;
import org.apache.cxf.tools.wsdlto.WSDLToJava;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
public class Wsdl2JavaUtil {
    private static final Object lock = new Object();

    private Wsdl2JavaUtil() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    public static byte[] generateJavaFromWsdl(String wsdlContent, String packageName, String outputDir) {
        synchronized (lock) {
            Path outputPath = null;
            Path tempWsdlFile = null;
            byte[] zipContent;

            try {
                outputPath = Paths.get(outputDir);
                Files.createDirectories(outputPath);

                // 創建臨時 WSDL 文件
                tempWsdlFile = Files.createTempFile(outputPath, "temp", ".wsdl");
                Files.write(tempWsdlFile, wsdlContent.getBytes());

                List<String> args = new ArrayList<>();
                args.add("-d");
                args.add(outputPath.toString());
                if (packageName != null && !packageName.isEmpty()) {
                    args.add("-p");
                    args.add(packageName);
                }
                args.add("-client");
                args.add(tempWsdlFile.toAbsolutePath().toString());

                WSDLToJava.main(args.toArray(new String[0]));

                // 檢查是否有文件生成
                boolean hasFiles;
                try (Stream<Path> pathStream = Files.list(outputPath)) {
                    Path finalTempWsdlFile = tempWsdlFile;
                    hasFiles = pathStream.anyMatch(p -> !p.equals(finalTempWsdlFile));
                }

                if (!hasFiles) {
                    log.warn("沒有文件被生成");
                    return new byte[0];
                }

                String zipFileName = "generated_classes.zip";
                Path zipFilePath = outputPath.resolve(zipFileName);

                createZipFile(outputPath, zipFilePath, tempWsdlFile);

                log.info("ZIP file created: {}", zipFilePath);

                zipContent = Files.readAllBytes(zipFilePath);

                return zipContent;

            } catch (Exception e) {
                log.error("處理失敗：", e);
                throw new WebserviceException("處理失敗：" + e.getMessage());
            } finally {
                if (tempWsdlFile != null) {
                    try {
                        Files.deleteIfExists(tempWsdlFile);
                    } catch (IOException e) {
                        log.error("刪除臨時 WSDL 文件失敗", e);
                    }
                }
                if (outputPath != null) {
                    cleanupFiles(outputPath);
                }
            }
        }
    }

    private static void createZipFile(Path outputPath, Path zipFilePath, Path tempWsdlFile) throws IOException {
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFilePath.toFile()))) {
            Files.walkFileTree(outputPath, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    if (!file.equals(zipFilePath) && !file.equals(tempWsdlFile)) {
                        String relativePath = outputPath.relativize(file).toString();
                        log.info("Adding file to ZIP: {}", relativePath);
                        ZipEntry zipEntry = new ZipEntry(relativePath);
                        zos.putNextEntry(zipEntry);
                        Files.copy(file, zos);
                        zos.closeEntry();
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        }
    }

    private static void cleanupFiles(Path outputPath) {
        try {
            Files.walkFileTree(outputPath, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
            log.info("清理完成：所有生成的檔案和目錄已刪除");
        } catch (IOException e) {
            log.error("清理檔案時發生錯誤：", e);
        }
    }
}
