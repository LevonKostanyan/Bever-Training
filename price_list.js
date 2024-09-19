async function initializePriceList(formContext) {
    let priceListId = formContext.data.entity.getId();

    let fetchXml = `
        <fetch version="1.0" mapping="logical" savedqueryid="79b9c784-209c-41ba-b0c3-b63f93e40c81" no-lock="false" distinct="true">
          <entity name="cr62c_price_list_items">
            <attribute name="cr62c_name"/>
            <attribute name="cr62c_price_list_itemsid"/>
            <attribute name="cr62c_fk_product"/>
            <attribute name="cr62c_mon_price_per_unit"/>
            <attribute name="cr62c_fk_price_list"/>
            <attribute name="transactioncurrencyid"/>
            <filter type="and">
              <condition attribute="cr62c_fk_price_list" operator="eq" value="${priceListId}" />
            </filter>
          </entity>
        </fetch>`;

    fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

    let priceListItems = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items", fetchXml);

    for (let item of priceListItems.entities) {
        await Xrm.WebApi.deleteRecord("cr62c_price_list_items", item.cr62c_price_list_itemsid);
    }

    let products = await Xrm.WebApi.retrieveMultipleRecords("product", "?$select=productid,name");
    let currencyId = formContext.getAttribute("transactioncurrencyid").getValue()[0].id;

    for (let product of products.entities) {
        let priceListRecord = {
            "cr62c_fk_price_list@odata.bind": priceListId,
            "cr62c_name": product.name,
            "cr62c_mon_price_per_unit": 1,
            "transactioncurrencyid@odata.bind": currencyId,
            "cr62c_fk_product@odata.bind": product.productid,
        };

        await Xrm.WebApi.createRecord("cr62c_price_list_items", priceListRecord);
    }

    Xrm.Navigation.openAlertDialog({text: "Price List initialization completed successfully!"});
}
