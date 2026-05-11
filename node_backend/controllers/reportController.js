const Report = require('../models/Report');

exports.index = async (req, res) => {
    try {
        const [stats, monthlyDonations, childrenByStatus] = await Promise.all([
            Report.getStats().catch(() => ({})),
            Report.getMonthlyDonations().catch(() => []),
            Report.getChildrenByStatus().catch(() => [])
        ]);
        
        const recentAdoptions = stats.recentRequests || [];
        
        if (req.session.role === 'admin') {
            res.render('reports/index', { 
                stats, 
                recentAdoptions: recentAdoptions || [], 
                monthlyDonations: monthlyDonations || [], 
                childrenByStatus: childrenByStatus || [] 
            });
        } else {
            res.render('reports/staff', { 
                stats 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

function generateCSV(data) {
    if (!data || data.length === 0) return '';
    const fields = Object.keys(data[0]);
    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
    };
    const header = fields.join(',') + '\n';
    const rows = data.map(row => fields.map(field => escapeCsv(row[field])).join(',')).join('\n');
    return header + rows;
}

exports.exportDonations = async (req, res) => {
    try {
        if (req.session.role !== 'admin') {
            req.flash('error', 'Access denied. Only administrators can export reports.');
            return res.redirect('/reports');
        }
        const data = await Report.exportDonations();
        const csv = generateCSV(data || []);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="donations-report.csv"');
        res.send(csv || 'No donations found');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error generating CSV');
    }
};

exports.exportChildren = async (req, res) => {
    try {
        if (req.session.role !== 'admin') {
            req.flash('error', 'Access denied. Only administrators can export reports.');
            return res.redirect('/reports');
        }
        const data = await Report.exportChildren();
        const csv = generateCSV(data || []);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="children-report.csv"');
        res.send(csv || 'No children found');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error generating CSV');
    }
};

exports.exportAdoptions = async (req, res) => {
    try {
        if (req.session.role !== 'admin') {
            req.flash('error', 'Access denied. Only administrators can export reports.');
            return res.redirect('/reports');
        }
        const data = await Report.exportAdoptions();
        const csv = generateCSV(data || []);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="adoptions-report.csv"');
        res.send(csv || 'No adoptions found');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error generating CSV');
    }
};

/** Browser “Save as PDF” / print-friendly HTML export */
exports.exportAdoptionsPrint = async (req, res) => {
    try {
        if (req.session.role !== 'admin') {
            req.flash('error', 'Access denied. Only administrators can export reports.');
            return res.redirect('/reports');
        }
        const rows = await Report.exportAdoptions();
        res.render('reports/adoptions_print', { rows: rows || [], printedAt: new Date() });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
