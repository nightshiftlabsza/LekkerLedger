import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    try:
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        
        paragraphs = []
        for elem in tree.iter():
            if elem.tag.endswith('}p'):
                texts = [node.text for node in elem.iter() if node.tag.endswith('}t') and node.text]
                if texts:
                    paragraphs.append(''.join(texts))
        
        return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

if len(sys.argv) > 1:
    for arg in sys.argv[1:]:
        print(f"====== File: {arg} ======")
        print(read_docx(arg))
        print("\n\n")
