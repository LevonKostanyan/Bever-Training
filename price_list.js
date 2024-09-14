async function initializePriceList(formContext) {
    const priceListId = formContext.data.entity.getId().replace('{', '').replace('}', '');

    try {
        const priceListItems = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items", `?$filter=_cr62c_fk_price_list_value eq '${priceListId}'`);

        for (const item of priceListItems.entities) {
            await Xrm.WebApi.deleteRecord("cr62c_price_list_items", item.cr62c_price_list_itemsid);
        }

        const products = await Xrm.WebApi.retrieveMultipleRecords("product", "?$select=productid,name");

        for (const product of products.entities) {
            const priceListRecord = {
                "cr62c_fk_price_list@odata.bind": `/cr62c_price_lists(${priceListId})`,
                "cr62c_fk_product@odata.bind": `/products(${product.productid})`,
                "uomid@odata.bind": "/uoms(19aa3f26-6f0b-4076-bc8f-9c773148ffbf)",
                "cr62c_mon_price_per_unit": 1,
                "cr62c_product_description": product.name,
                "transactioncurrencyid@odata.bind": `/transactioncurrencies(${formContext.getAttribute("transactioncurrencyid").getValue()[0].id})`
            };

            await Xrm.WebApi.createRecord("cr62c_price_list_items", priceListRecord);
        }

        Xrm.Navigation.openAlertDialog({ text: "Price List initialization completed successfully!" });
    } catch (error) {
        console.error("Error initializing Price List: ", error);
        Xrm.Navigation.openAlertDialog({ text: "Error occurred during Price List initialization." });
    }
}
