async function processInventoryOperation(executionContext) {
    const formContext = executionContext.getFormContext();

    const popupData = formContext.getAttribute("popupData").getValue();
    if (!popupData) return;

    const operationType = popupData.operationType;
    const quantity = popupData.quantity;
    const product = formContext.getAttribute("cr62c_product").getValue();
    const inventoryId = formContext.getAttribute("cr62c_fk_inventory").getValue()[0].id;

    if (!product || !quantity || quantity <= 0) {
        alert("Invalid input data.");
        return;
    }

    const productId = product[0].id;

    try {
        const fetchXml = `
            <fetch top="1">
                <entity name="cr62c_inventory_product">
                    <attribute name="cr62c_dec_quantity" />
                    <filter>
                        <condition attribute="cr62c_fk_product" operator="eq" value="${productId}" />
                        <condition attribute="cr62c_fk_inventory" operator="eq" value="${inventoryId}" />
                    </filter>
                </entity>
            </fetch>`;

        const results = await Xrm.WebApi.retrieveMultipleRecords("cr62c_inventory_product", `?fetchXml=${encodeURIComponent(fetchXml)}`);

        if (operationType === 'In') {
            if (results.entities.length > 0) {
                const existingRecordId = results.entities[0].cr62c_inventory_productid;
                const currentQuantity = results.entities[0].cr62c_dec_quantity;
                const newQuantity = currentQuantity + quantity;

                await Xrm.WebApi.updateRecord("cr62c_inventory_product", existingRecordId, { cr62c_dec_quantity: newQuantity });
            } else {
                const newInventoryProduct = {
                    "cr62c_fk_product@odata.bind": `/products(${productId})`,
                    "cr62c_fk_inventory@odata.bind": `/cr62c_inventories(${inventoryId})`,
                    "cr62c_dec_quantity": quantity
                };

                await Xrm.WebApi.createRecord("cr62c_inventory_product", newInventoryProduct);
            }
        } else if (operationType === 'Out') {
            if (results.entities.length > 0) {
                const existingRecordId = results.entities[0].cr62c_inventory_productid;
                const currentQuantity = results.entities[0].cr62c_dec_quantity;

                if (currentQuantity >= quantity) {
                    const newQuantity = currentQuantity - quantity;
                    await Xrm.WebApi.updateRecord("cr62c_inventory_product", existingRecordId, { cr62c_dec_quantity: newQuantity });
                } else {
                    alert("Insufficient quantity in inventory.");
                }
            } else {
                alert("Product does not exist in inventory.");
            }
        }
    } catch (error) {
        console.error("Error processing inventory operation:", error);
        alert("Error occurred during inventory operation.");
    }
}

function openInventoryOperationPopup(executionContext) {
    const formContext = executionContext.getFormContext();

    const pageInput = {
        pageType: "webresource",
        webresourceName: "your_html_popup_web_resource_name",
        data: null
    };

    const navigationOptions = {
        target: 2,
        width: { value: 400, unit: "px" },
        height: { value: 200, unit: "px" },
        position: 1,
        title: "Inventory Operation"
    };

    Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
        function success() {
            processInventoryOperation(executionContext);
        },
        function error() {
            console.error("Error opening inventory operation popup.");
        }
    );
}
