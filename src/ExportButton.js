function exportToCSV(data) {
    const csvContent = data.facturas.map(factura => {
        const descripcionLimpia = factura.descripcionOperacion.replace(/\n|\r/g, " ").replace(/"/g, '""');
        const razonSocialLimpia = factura.razonSocial ? factura.razonSocial : factura.nombre + ' ' + factura.primerApellido + ' ' + factura.segundoApellido;
        return [
            `"${factura.serieFactura}"`,
            `"${factura.numeroFactura}"`,
            `"${factura.fechaExpedicionFactura}"`,
            `"${factura.idDocumentoDestinatario}"`,
            `"${razonSocialLimpia}"`,
            `"${descripcionLimpia}"`,
            `"${factura.importeTotalFactura.toString().replace(".", ",")}"`
        ].join(",");
    }).join("\n");

    const blob = new Blob(["Serie,Zenbakia,Data,IFZ,Bezeroa,Azalpena,Guztira\n" + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fakturak.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function buildFiltro(idPersona) {
    const currentYear = new Date().getFullYear();
    let filtro = {
        idntPersonaObligado: idPersona,
        fechaEmisionDesde: buildFecha('fechaDesde'),
        fechaEmisionHasta: buildFecha('fechaHasta'),
        diezUltimas: false,
        fechaUltimaActualizacionDesde: null,
        fechaUltimaActualizacionHasta: null,
        numDocumento: document.querySelector('[name=numDocumento]').value,
        estadoRegistro: document.querySelector('[name=estadoRegistro]').value
    };
    if(document.querySelector('[name=serieFac]').value) {
        filtro.serieFactura = document.querySelector('[name=serieFac]').value;
    }
    return encodeURIComponent(JSON.stringify(filtro));
}

function buildFecha(type) {
    source = document.querySelector(`input[name=${type}]`).value;
    if (!source) {
        return null;
    }
    const [day, month, year] = source.split("/");
    return `${year}-${month}-${day}`;
}

function waitForElement(selector, callback) {
    let timeout = setTimeout(() => {
        observer.disconnect();
        console.warn('Timeout: Element not found');
    }, 10000);
    const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            clearTimeout(timeout);
            obs.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function addExportButton() {
    waitForElement(".p-datatable-scrollable-header-box", (container) => {
        const button = document.createElement("button");
        button.className = "p-button p-component p-button-info p-button-text-icon-left";
        button.innerHTML = `<span class="pi pi-download p-c p-button-icon-left"></span><span class="p-button-text p-c">CSV</span>`;
        button.onclick = async () => {
            let sessionData;
            try {
                sessionData = JSON.parse(sessionStorage.getItem("bide-seguridad:sessionData")) || {};
            } catch (e) {
                console.error("Failed to parse session data:", e);
                sessionData = {};
            }
            const idPersona = sessionData?.session?.userSession?.idPersona;
            const accessToken = sessionData?.accessToken;
            if (idPersona && accessToken) {
                const filtro = buildFiltro(idPersona);
                let data;
                try {
                    const response = await fetch(`https://batuz.eus/B4TBFA0M/rest/v1/factura/obtenerListadoFacturasFiltro?filtro=${filtro}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    data = await response.json();
                } catch (error) {
                    console.error('Fetch error:', error);
                    alert('Failed to fetch invoices. Please try again later.');
                    return;
                }
                exportToCSV(data);
            } else {
                alert("Failed to retrieve session data or access token.");
            }
        };
        container.appendChild(button);
    });
}