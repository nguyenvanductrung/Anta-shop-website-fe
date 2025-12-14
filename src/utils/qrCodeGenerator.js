export const generateMoMoQR = (orderData) => {
  const { total, orderNumber } = orderData;
  
  const momoInfo = {
    phoneNumber: '0974945488',
    accountName: 'ANTA VIETNAM',
    amount: total,
    note: `ANTA ${orderNumber}`,
    bankCode: 'MOMO'
  };

  const qrContent = `2|99|${momoInfo.phoneNumber}|${momoInfo.accountName}|${momoInfo.amount}|${momoInfo.note}|0|0|${total}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
  
  return {
    qrCodeUrl,
    ...momoInfo
  };
};

export const generateVNPayQR = (orderData) => {
  const { total, orderNumber } = orderData;
  
  const vnpayInfo = {
    bankAccount: '9704229208460859',
    bankName: 'TECHCOMBANK',
    accountName: 'ANTA VIETNAM',
    amount: total,
    note: `ANTA ${orderNumber}`
  };

  const qrContent = `${vnpayInfo.bankAccount}|${vnpayInfo.bankName}|${vnpayInfo.accountName}|${vnpayInfo.amount}|${vnpayInfo.note}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
  
  return {
    qrCodeUrl,
    ...vnpayInfo
  };
};

export const generateBankTransferQR = (orderData) => {
  const { total, orderNumber } = orderData;
  
  const bankInfo = {
    bankAccount: '19036547128019',
    bankName: 'Vietcombank',
    accountName: 'CONG TY ANTA VIETNAM',
    amount: total,
    note: `ANTA ${orderNumber}`
  };

  const qrContent = `https://img.vietqr.io/image/VCB-${bankInfo.bankAccount}-compact.png?amount=${total}&addInfo=${encodeURIComponent(bankInfo.note)}`;
  
  return {
    qrCodeUrl: qrContent,
    ...bankInfo
  };
};
