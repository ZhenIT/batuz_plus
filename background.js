chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "https://batuz.eus/haztufactura/#/consulta-facturas" });
  });