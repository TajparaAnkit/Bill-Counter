export const loadHtml2Pdf = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) {
      resolve((window as any).html2pdf);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
      } else {
        reject(new Error('html2pdf load failed'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load html2pdf script'));
    };
    document.body.appendChild(script);
  });
};

export const generatePDF = async (elementId: string, filename: string) => {
  const html2pdf = await loadHtml2Pdf();
  const original = document.getElementById(elementId);
  if (!original) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  // Create clean wrapper
  const wrapper = document.createElement('div');
  wrapper.style.width = '210mm'; // Exact A4 width
  wrapper.style.padding = '15mm';
  wrapper.style.background = '#ffffff';
  wrapper.style.boxSizing = 'border-box';

  const clone = original.cloneNode(true) as HTMLElement;

  // Convert inputs to plain text
  clone.querySelectorAll('input').forEach((input: any) => {
    const span = document.createElement('div');
    span.innerText = input.value || '-';
    span.style.padding = '6px 0';
    input.replaceWith(span);
  });

  // Remove buttons
  clone.querySelectorAll('button').forEach((btn: any) => btn.remove());

  // Remove last column (Action buttons)
  clone.querySelectorAll('tr').forEach((row: any) => {
    if (row.cells.length > 4) {
      row.deleteCell(-1);
    }
  });

  // Fix table styles for print
  clone.querySelectorAll('table').forEach((table: any) => {
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
    table.style.borderCollapse = 'collapse';
  });

  clone.querySelectorAll('th, td').forEach((cell: any) => {
    cell.style.border = '1px solid #ddd';
    cell.style.padding = '10px';
    cell.style.wordBreak = 'break-word';
  });

  // Fix logo styling
  const logo = clone.querySelector('img');
  if (logo) {
    logo.style.maxWidth = '120px';
    logo.style.height = 'auto';
    logo.style.objectFit = 'contain';
  }

  // Fix total container alignment
  const totalSection = clone.querySelector('.text-right');
  if (totalSection) {
    totalSection.setAttribute('style', 'margin-top: 20px; padding-bottom: 20px; text-align: right;');
  }

  clone.style.pageBreakInside = 'avoid';
  wrapper.appendChild(clone);

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().set(opt).from(wrapper).save();
};
