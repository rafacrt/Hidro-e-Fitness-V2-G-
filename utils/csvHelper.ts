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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            const delimiter = semicolonCount > commaCount ? ';' : ',';

            // Regex to split by delimiter while ignoring delimiters inside quotes
            // The regex dynamically adapts to the detected delimiter
            const regex = new RegExp(`\\s*${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)\\s*`);

            const headers = lines[0].split(regex).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

            const result = lines.slice(1).map(line => {
                const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

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
    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `modelo_${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
