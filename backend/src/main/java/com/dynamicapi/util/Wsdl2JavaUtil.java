package com.dynamicapi.util;

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
    // 私有構造函數，防止實例化
    private Wsdl2JavaUtil() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    public static byte[] generateJavaFromWsdl(String wsdlUrl, String packageName, String outputDir) {
        synchronized (lock) {
            Path outputPath = null;
            byte[] zipContent;

            try {
                // 創建實體輸出目錄
                outputPath = Paths.get(outputDir);
                Files.createDirectories(outputPath);

                List<String> args = new ArrayList<>();
                args.add("-d");
                args.add(outputPath.toString());
                if (packageName != null && !packageName.isEmpty()) {
                    args.add("-p");
                    args.add(packageName);
                }
                args.add("-client");
                args.add(wsdlUrl);

                // 執行 WSDL 到 Java 的轉換
                WSDLToJava.main(args.toArray(new String[0]));

                // 檢查是否有文件生成
                boolean hasFiles;
                try (Stream<Path> pathStream = Files.list(outputPath)) {
                    hasFiles = pathStream.findAny().isPresent();
                }

                if (!hasFiles) {
                    log.warn("沒有文件被生成");
                    return new byte[0];
                }

                // 創建 ZIP 文件
                String zipFileName = "generated_classes.zip";
                Path zipFilePath = outputPath.resolve(zipFileName);

                createZipFile(outputPath, zipFilePath);

                log.info("ZIP file created: {}", zipFilePath);

                // 讀取 ZIP 文件內容到記憶體
                zipContent = Files.readAllBytes(zipFilePath);

                return zipContent;

            } catch (Exception e) {
                log.error("處理失敗：", e);
                return new byte[0];
            } finally {
                // 清理所有生成的檔案和目錄
                if (outputPath != null) {
                    cleanupFiles(outputPath);
                }
            }
        }
    }

    private static void createZipFile(Path outputPath, Path zipFilePath) throws IOException {
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFilePath.toFile()))) {
            Files.walkFileTree(outputPath, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    if (!file.equals(zipFilePath)) {
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
