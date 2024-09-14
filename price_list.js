async function initializePriceList(formContext) {
    const priceListId = formContext.data.entity.getId();

    try {
        const priceListItems = await Xrm.WebApi.retrieveMultipleRecords("priceListItem", `?$filter=_pricelevelid_value eq ${priceListId}`);
        for (const item of priceListItems.entities) {
            await Xrm.WebApi.deleteRecord("priceListItem", item.pricelistitemid);
        }

        const products = await Xrm.WebApi.retrieveMultipleRecords("product", "?$select=productid,name");

        for (const product of products.entities) {
            const priceListRecord = {
                "pricelevelid@odata.bind": `/pricelevels(${priceListId})`,
                "productid@odata.bind": `/products(${product.productid})`,
                "uomid@odata.bind": "/uoms(00000000-0000-0000-0000-000000000000)",
                "amount": 1, // Price Per Unit
                "productdescription": product.name,
                "transactioncurrencyid@odata.bind": `/transactioncurrencies(${formContext.getAttribute("transactioncurrencyid").getValue()[0].id})`
            };
            await Xrm.WebApi.createRecord("priceListItem", priceListRecord);
        }

        Xrm.Navigation.openAlertDialog({ text: "Price List initialization completed successfully!" });
    } catch (error) {
        console.error("Error initializing Price List: ", error);
        Xrm.Navigation.openAlertDialog({ text: "Error occurred during Price List initialization." });
    }
}
