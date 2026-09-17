import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

/// Generates and shares downloadable files (PDF, HTML, Markdown, plain code).
/// Called from chat when the AI produces a code/PDF/HTML/Markdown artifact.
class ArtifactService {
  static Future<Directory> _tempDir() async {
    final dir = await getTemporaryDirectory();
    final sub = Directory('${dir.path}/imu_artifacts');
    if (!await sub.exists()) await sub.create(recursive: true);
    return sub;
  }

  /// Generate a PDF from Markdown-ish text.
  static Future<File> generatePdf(String title, String body) async {
    final doc = pw.Document(title: title);
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(48),
        build: (context) => [
          pw.Text(title, style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 16),
          ..._paragraphs(body).map((p) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 8),
            child: pw.Text(p, style: const pw.TextStyle(fontSize: 11, height: 1.5)),
          )),
        ],
      ),
    );
    final dir = await _tempDir();
    final file = File('${dir.path}/$title.pdf');
    await file.writeAsBytes(await doc.save());
    return file;
  }

  static List<String> _paragraphs(String text) {
    final lines = text.split('\n').map((l) => l.trim()).toList();
    final out = <String>[];
    final buf = StringBuffer();
    for (final line in lines) {
      if (line.isEmpty) {
        if (buf.isNotEmpty) {
          out.add(buf.toString());
          buf.clear();
        }
      } else {
        if (buf.isNotEmpty) buf.write(' ');
        buf.write(line);
      }
    }
    if (buf.isNotEmpty) out.add(buf.toString());
    return out.isEmpty ? [text] : out;
  }

  /// Write a text file (HTML/Markdown/code) to disk.
  static Future<File> writeTextFile(String name, String content) async {
    final dir = await _tempDir();
    final safeName = name.replaceAll(RegExp(r'[^\w.\-]'), '_');
    final file = File('${dir.path}/$safeName');
    await file.writeAsString(content);
    return file;
  }

  /// Share/download a file via the OS share sheet (works as download on mobile).
  static Future<void> share(File file, {String? subject}) async {
    await SharePlus.instance.share(
      ShareParams(files: [XFile(file.path)], subject: subject, text: subject),
    );
  }

  /// Open/print a PDF using the system PDF viewer.
  static Future<void> openPdf(File file) async {
    await Printing.layoutPdf(onLayout: (_) => file.readAsBytes());
  }
}