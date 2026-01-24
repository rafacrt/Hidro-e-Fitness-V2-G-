export const exportToCSV = (data: any[], headers: string[], filename: string) => {
    console.log('Iniciando exportação CSV...', { dataLength: data?.length, filename });
    if (!data || !data.length) {
        console.warn('Tentativa de exportar sem dados.');
        alert('Não há dados para exportar.');
        return;
    }

    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(fieldName => {
                const value = row[fieldName] !== undefined && row[fieldName] !== null ? row[fieldName] : '';
                // Escape quotes and wrap in quotes if contains comma
                const stringValue = String(value).replace(/"/g, '""');
                return `"${stringValue}"`;
            }).join(',')
        )
    ].join('\n');

    // Add BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Download CSV finalizado (recursos limpos).');
    }, 2000);
};

export const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return resolve([]);

            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) return resolve([]);

            // Detect delimiter (check first line)
            const firstLine = lines[0];
            const commaCount = (firstLine.match(/,/g) || []).length;
            const semicolonCount = (firstLine.match(/;/g) || []).length;
            const delimiter = semicolonCount >= commaCount ? ';' : ','; // Default to semicolon if equal or greater

            console.log("Detected delimiter:", delimiter);

            // Robust CSV splitting regex
            // This handles: values; "quoted;values"; "values""with""quotes"
            const splitCheck = new RegExp(`(?:^|${delimiter})(\s*(?:(?:"(?:[^"]*")*")|(?:[^"${delimiter}]*)))`, 'g');

            // Simple helper to parse a line
            const parseLine = (line: string) => {
                const result = [];
                let match;
                const lineWithCaret = delimiter + line; // Prepended delimiter to match regex logic

                // Reset regex state
                splitCheck.lastIndex = 0;

                // Use a simpler approach for splitting if complex regex fails often
                // Traditional split by delimiter but respect quotes
                const chars = line.split('');
                let current = '';
                let insideQuote = false;

                for (let i = 0; i < chars.length; i++) {
                    const char = chars[i];
                    const nextChar = chars[i + 1];

                    if (char === '"') {
                        if (insideQuote && nextChar === '"') {
                            current += '"';
                            i++; // skip next quote
                        } else {
                            insideQuote = !insideQuote;
                        }
                    } else if (char === delimiter && !insideQuote) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim());
                return result;
            };

            const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());

            const result = lines.slice(1).map(line => {
                const values = parseLine(line).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));

                const obj: any = {};
                headers.forEach((header, index) => {
                    // Handle potential mismatch in column counts
                    obj[header] = values[index] !== undefined ? values[index] : '';
                });
                return obj;
            });

            resolve(result);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

export const downloadTemplate = (headers: string[], filename: string) => {
    console.log('Gerando template CSV para:', filename);
    const csvContent = headers.join(',');

    // Add BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', `modelo_${filename}.csv`);

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Download CSV finalizado (recursos limpos).');
    }, 2000);
};
