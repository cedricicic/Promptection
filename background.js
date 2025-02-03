chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    state: {
      enabled: false,
      counter: 0,
      replacements: {},
      settings: {
        maskStyle: "replace",
        patterns: {
          Email: true,
          Password: true,
          CreditCard: true,
          Pin: true,
          Phone: true,
          Ssn: true,
          Address: true,
          MonetaryValue: true,
          Date: true,
          Timeframe: true,
          PassportNumber: true,
          DriversLicense: true,
          EmployeeId: true,
          StudentId: true,
          IpAddress: true,
          SocialMediaHandle: true,
          InvoiceNumber: true,
          MedicalRecordNumber: true,
          HealthInsuranceInfo: true,
          CaseNumber: true,
          ApiKey: true,
          Hostname: true,
          Gpa: true,
          Transcript: true,
          Location: true,
          BankAccountNumber: true,
        },
      },
    },
  });
});
  
  