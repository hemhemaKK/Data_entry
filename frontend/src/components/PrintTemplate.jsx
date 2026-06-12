import React from 'react';

const PrintTemplate = ({
    clientName,
    clientPhone,
    placeName,
    dateRangeString,
    finalBalance,
    flowers,
    commissionPercent,
    commissionDeduction,
    clientTotalLaggage,
    clientTotalCollie,
    clientTotalPrice,
    periodDeduction,
    grandTotal,
    columns
}) => {
    return (
        <div className="print-template-container" style={{ pageBreakAfter: 'always', paddingBottom: '2rem' }}>
            <div className="print-header" style={{ marginBottom: '1rem' }}>
                <img 
                    src="/header.jpeg" 
                    alt="Header Image" 
                    style={{ width: '100%', display: 'block', marginBottom: '10px' }} 
                />
                <div style={{ marginTop: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', fontWeight: 'bold', background: 'white', color: 'black' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px', width: '20%', border: '1px solid #ccc' }}>Party Name:</td>
                                <td style={{ padding: '4px', width: '30%', border: '1px solid #ccc' }}>{clientName}</td>
                                <td style={{ padding: '4px', width: '20%', border: '1px solid #ccc' }}></td>
                                <td style={{ padding: '4px', width: '30%', border: '1px solid #ccc' }}></td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #ccc' }}>Phone:</td>
                                <td style={{ padding: '4px', border: '1px solid #ccc' }}>{clientPhone || ''}</td>
                                <td style={{ padding: '4px', border: '1px solid #ccc' }}>Dates:</td>
                                <td style={{ padding: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }}>{dateRangeString}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #ccc' }}>Address:</td>
                                <td style={{ padding: '4px', border: '1px solid #ccc' }}>{placeName || ''}</td>
                                <td style={{ padding: '4px', border: '1px solid #ccc' }}>பாக்கி:</td>
                                <td style={{ padding: '4px', border: '1px solid #ccc', color: 'black' }}>{clientBalanceFormatted(finalBalance)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {flowers?.map(flower => (
                <div key={flower.id} style={{ marginBottom: '1.5rem' }}>
                    <h4 className="print-only" style={{ margin: '16px 0 8px 0', fontSize: '1rem', color: 'black' }}>Flower: {flower.name}</h4>
                    <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.1rem', textAlign: 'left', color: 'black' }}>
                        <colgroup>
                            {columns?.date && <col style={{ width: '18%' }} />}
                            {columns?.van && <col style={{ width: '10%' }} />}
                            {columns?.weight && <col style={{ width: '15%' }} />}
                            {columns?.rate && <col style={{ width: '15%' }} />}
                            {columns?.total && <col style={{ width: '18%' }} />}
                            {columns?.laggage && <col style={{ width: '12%' }} />}
                            {columns?.collie && <col style={{ width: '12%' }} />}
                        </colgroup>
                        <thead>
                            <tr style={{ borderBottom: '1px solid black' }}>
                                {columns?.date && <th className="col-date" style={{ padding: '4px', fontWeight: 'bold' }}>Date</th>}
                                {columns?.van && <th className="col-van" style={{ padding: '4px', fontWeight: 'bold' }}>Van</th>}
                                {columns?.weight && <th className="col-weight" style={{ padding: '4px', fontWeight: 'bold' }}>Weight</th>}
                                {columns?.rate && <th className="col-rate" style={{ padding: '4px', fontWeight: 'bold' }}>Rate</th>}
                                {columns?.total && <th className="col-total" style={{ padding: '4px', fontWeight: 'bold' }}>Total</th>}
                                {columns?.laggage && <th className="col-laggage" style={{ padding: '4px', fontWeight: 'bold' }}>Laggage</th>}
                                {columns?.collie && <th className="col-collie" style={{ padding: '4px', fontWeight: 'bold' }}>Collie</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {flower.records?.map((r, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                                    {columns?.date && <td className="col-date" style={{ padding: '4px' }}>{r.date}</td>}
                                    {columns?.van && <td className="col-van" style={{ padding: '4px' }}>{r.van || '-'}</td>}
                                    {columns?.weight && <td className="col-weight" style={{ padding: '4px' }}>{r.weight !== null && r.weight !== undefined ? parseFloat(r.weight).toFixed(3) : '-'}</td>}
                                    {columns?.rate && <td className="col-rate" style={{ padding: '4px' }}>{r.rate ? parseFloat(r.rate).toFixed(2) : '-'}</td>}
                                    {columns?.total && <td className="col-total" style={{ padding: '4px', fontWeight: 'bold' }}>{((parseFloat(r.weight) || 0) * (parseFloat(r.rate) || 0)).toFixed(0)}</td>}
                                    {columns?.laggage && <td className="col-laggage" style={{ padding: '4px' }}>{r.laggage || '0'}</td>}
                                    {columns?.collie && <td className="col-collie" style={{ padding: '4px' }}>{r.collie || '0'}</td>}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '1px solid black', fontWeight: 'bold', backgroundColor: '#f0f0f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <td colSpan={(columns?.date ? 1 : 0) + (columns?.van ? 1 : 0)} style={{ padding: '4px', textAlign: 'right' }}>Total:</td>
                                {columns?.weight && <td className="col-weight" style={{ padding: '4px' }}>{Number(flower.totals?.weight || 0).toFixed(3)}</td>}
                                {columns?.rate && <td className="col-rate" style={{ padding: '4px' }}></td>}
                                {columns?.total && <td className="col-total" style={{ padding: '4px' }}>{Number(flower.totals?.price || 0).toFixed(0)}</td>}
                                {columns?.laggage && <td className="col-laggage" style={{ padding: '4px' }}>{Number(flower.totals?.laggage || 0).toFixed(2)}</td>}
                                {columns?.collie && <td className="col-collie" style={{ padding: '4px' }}>{Number(flower.totals?.collie || 0).toFixed(2)}</td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ))}
            
            <div style={{ display: 'flex', width: '80%', margin: '8px auto 0 auto', border: '1px solid black', fontSize: '1rem', fontWeight: 'bold', color: 'black', background: '#ffffff', pageBreakInside: 'avoid' }}>
                <div style={{ flex: 1, padding: '8px', borderRight: '1px solid black' }}>
                    {commissionPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Commission:</span>
                            <span>{Number(commissionDeduction || 0).toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Laggage:</span>
                        <span>{Number(clientTotalLaggage || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Collie:</span>
                        <span>{Number(clientTotalCollie || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid black', paddingTop: '4px' }}>
                        <span>Total Deductions:</span>
                        <span>{Number((commissionDeduction || 0) + (clientTotalLaggage || 0) + (clientTotalCollie || 0)).toFixed(2)}</span>
                    </div>
                </div>
                
                <div style={{ flex: 1, padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{flowers?.length > 1 ? 'Total of All Flowers:' : 'Total Amount:'}</span>
                        <span>{Number(clientTotalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'red' }}>
                        <span>Less: Total Deductions:</span>
                        <span>-{Number((commissionDeduction || 0) + (clientTotalLaggage || 0) + (clientTotalCollie || 0)).toFixed(2)}</span>
                    </div>
                    {periodDeduction !== null && periodDeduction !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'red' }}>
                            <span>Advance Deduction:</span>
                            <span>-{Number(periodDeduction || 0).toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid black', paddingTop: '4px', color: 'green', fontSize: '1.1rem' }}>
                        <span>Grand Total:</span>
                        <span>{Number(Math.abs(grandTotal || 0)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

function clientBalanceFormatted(balance) {
    if (balance === null || balance === undefined) return '0.00';
    return Math.abs(balance).toFixed(2);
}

export default PrintTemplate;
