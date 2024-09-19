async function CalculateTotalPriceInInventory(formContext) {
    let recordId = formContext.data.entity.getId();

    let fetchXml = `
    <fetch version="1.0" mapping="logical" distinct="true">
        <entity name="cr62c_inventory_product">
            <attribute name="cr62c_name"/>
            <attribute name="statecode"/>
            <attribute name="cr62c_inventory_productid"/>
            <attribute name="cr62c_product"/>
            <attribute name="cr62c_dec_quantity"/>
            <attribute name="cr62c_mon_price_per_unit"/>
            <attribute name="cr62c_mon_total_amount"/>
            <attribute name="cr62c_fk_inventory"/>
            <filter type="and">
                <condition attribute="cr62c_fk_inventory" operator="eq" value="${recordId}" />
            </filter>
        </entity>
    </fetch>`;

    fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

    try {
        let inventoryLinesArray = await Xrm.WebApi.retrieveMultipleRecords('cr62c_inventory_product', fetchXml);
        let inventoryLinesQuantity = inventoryLinesArray.entities.length;

        let priceList = formContext.getAttribute("cr62c_price_list").getValue();
        if (priceList === null) {
            console.error("Price List is null.");
            return;
        }
        let priceListId = priceList[0].id.toLowerCase();

        let totalPrice = 0;

        for (let i = 0; i < inventoryLinesQuantity; i++) {
            let line = inventoryLinesArray.entities[i];

            let linePriceListId = line["priceListItem.cr62c_price_list"]?.toLowerCase();
            if (linePriceListId === priceListId) {
                let quantity = line["cr62c_dec_quantity"];
                let price = line["priceListItem.cr62c_mon_price"];

                if (quantity && price) {
                    totalPrice += price * quantity;
                }
            }
        }

        formContext.getAttribute("cr62c_mon_total_amount").setValue(totalPrice);

    } catch (error) {
        console.error("Error calculating total price: ", error);
    }
}

function autofillAndHideFields(executionContext) {
    let Form = executionContext.getFormContext();
    let product = Form.getAttribute("cr62c_product").getValue();

    if (product != null) {
        let productName = product[0].name;
        Form.getAttribute("cr62c_slot_name").setValue(productName);
    }

    Form.getControl("cr62c_slot_name").setVisible(false);
    Form.getControl("OwnerId").setVisible(false);
}

async function setPricePerUnitFromPriceListOrProduct(executionContext) {
    const formContext = executionContext.getFormContext();

    const productLookup = formContext.getAttribute("cr62c_fk_product").getValue();
    const priceListLookup = formContext.getAttribute("cr62c_price_list").getValue();

    if (productLookup == null) {
        formContext.getAttribute("cr62c_mon_price_per_unit").setValue(null);
        return;
    }

    const productId = productLookup[0].id.replace("{", "").replace("}", "");
    let pricePerUnit = null;

    if (priceListLookup != null) {
        const priceListId = priceListLookup[0].id.replace("{", "").replace("}", "");

        try {
            const priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("priceListItem",
                `?$filter=_cr62c_fk_product_value eq ${productId} and _cr62c_fk_price_list_value eq ${priceListId}&$select=priceperunit`);

            if (priceListItemRecords.entities.length > 0) {
                pricePerUnit = priceListItemRecords.entities[0].priceperunit;
            }
        } catch (error) {
            console.error("Error retrieving price from price list: ", error);
        }
    }

    if (pricePerUnit === null) {
        try {
            const productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=defaultpriceperunit");
            pricePerUnit = productRecord.defaultpriceperunit;
        } catch (error) {
            console.error("Error retrieving default price from product: ", error);
        }
    }

    if (pricePerUnit !== null) {
        formContext.getAttribute("cr62c_mon_price_per_unit").setValue(pricePerUnit);
        formContext.getControl("cr62c_mon_price_per_unit").setDisabled(true);
    }
}

async function checkProductInInventory(executionContext) {
    const formContext = executionContext.getFormContext();
    const product = formContext.getAttribute("cr62c_product").getValue();

    if (product == null) {
        return;
    }

    const productId = product[0].id;
    const inventoryId = formContext.getAttribute("cr62c_fk_inventory").getValue()[0].id;

    try {
        const fetchXml = `
        <fetch top="1">
            <entity name="cr62c_inventory_product">
                <filter>
                    <condition attribute="cr62c_fk_product" operator="eq" value="${productId}" />
                    <condition attribute="cr62c_fk_inventory" operator="eq" value="${inventoryId}" />
                </filter>
            </entity>
        </fetch>`;

        const results = await Xrm.WebApi.retrieveMultipleRecords("cr62c_inventory_product", `?fetchXml=${encodeURIComponent(fetchXml)}`);

        if (results.entities.length > 0) {
            formContext.getControl("cr62c_product").setNotification("InventoryProductPopup is already added to this inventory.", "product_notification");
        } else {
            formContext.getControl("cr62c_product").clearNotification("product_notification");
        }
    } catch (error) {
        console.error("Error checking product in inventory:", error);
    }
}

async function calculateChildQuantity(executionContext) {
    let Form = executionContext.getFormContext();

    let inventoryId = Form.getAttribute("cr62c_fk_inventory").getValue();
    if (!inventoryId) {
        console.error("Inventory ID is null, calculation cannot proceed.");
        return;
    }

    let fetchXml = `
    <fetch version="1.0" mapping="logical" distinct="true">
        <entity name="cr62c_inventory_product">
            <attribute name="cr62c_name"/>
            <attribute name="statecode"/>
            <attribute name="cr62c_inventory_productid"/>
            <attribute name="cr62c_product"/>
            <attribute name="cr62c_dec_quantity"/>
            <attribute name="cr62c_mon_price_per_unit"/>
            <attribute name="cr62c_mon_total_amount"/>
            <attribute name="cr62c_fk_inventory"/>
            <filter type="and">
                <condition attribute="cr62c_fk_inventory" operator="eq" value="${inventoryId[0].id}" />
            </filter>
        </entity>
    </fetch>`;

    try {
        let results = await Xrm.WebApi.retrieveMultipleRecords("cr62c_inventory_product", `?fetchXml=${encodeURIComponent(fetchXml)}`);

        let totalQuantity = 0;

        if (results.entities.length > 0) {
            results.entities.forEach(record => {
                totalQuantity += record.cr62c_dec_quantity;
            });
        }

        Form.getAttribute("total_quantity_field").setValue(totalQuantity);
    } catch (error) {
        console.error("Error executing FetchXML query: ", error);
    }
}