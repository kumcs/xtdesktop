/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockSalesAct;
var _salesAct;

/*!
  Initializes Sales Activity dock widget and places it in the main window.
*/
function initDockSalesAct()
{
  if (!privileges.check("ViewSalesActivitiesDock"))
    return;

  _dockSalesAct = toolbox.loadUi("dockList").findChild("_dockList");
  _dockSalesAct.windowTitle = qsTr("Sales Activities");
  _dockSalesAct.objectName = "_dockSalesAct";
  mainwindow.addDockWidget(0x1, _dockSalesAct);

  // Set columns on list
  _salesAct = _dockSalesAct.findChild("_list");
  _salesAct.objectName = "_salesAct";
  _salesAct.addColumn(qsTr("Type"), -1,  Qt.AlignLeft,   true, "activity");
  _salesAct.addColumn(qsTr("#"), 40,  Qt.AlignRight,  true, "count");
  _salesAct.addColumn(qsTr("Amount"), -1,  Qt.AlignRight,  true, "amount");
  fillListSalesAct()

  // Connect Signals and Slots
  _dtTimer.timeout.connect(fillListSalesAct);
  mainwindow.billingSelectionUpdated.connect(fillListSalesAct);
  mainwindow.invoicesUpdated.connect(fillListSalesAct);
  mainwindow.quotesUpdated.connect(fillListSalesAct)
  mainwindow.salesOrdersUpdated.connect(fillListSalesAct);

  _salesAct.itemSelected.connect(openWindowSalesAct);
  _salesAct["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuSalesAct);

  _dockSalesAct.visibilityChanged.connect(fillListSalesAct);

  if (!_hasSavedState)
    fillListSalesAct();

  // Add to array to tabify later if need be
  _leftAreaDocks[_leftAreaDocks.length]=_dockSalesAct;
}

/*!
  Fills the list with active sales data.
*/
function fillListSalesAct()
{
  if (!_dockSalesAct.visible)
    return;

  var params = new Object;
  params.quotes = qsTr("Quotes");
  params.open = qsTr("Orders");
  params.print = qsTr("To Print");
  params.pick = qsTr("Pick");
  params.ship = qsTr("At Shipping");
  params.bill = qsTr("Shipped");
  params.invoice = qsTr("To Bill");
  params.post = qsTr("Invoiced");

  _salesAct.populate(toolbox.executeDbQuery("desktop","salesAct", params));
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowSalesAct()
{
  var ui;
  var run = false;
  var act = _salesAct.currentItem().rawValue("activity");
  
  // Make sure we can open the window for this activity
  if (!privilegeCheckSalesAct(act))
    return;

  // Determine which window to open
  if (act == "Q")
  {
    ui = "quotes";
    run = true;
  }
  else if (act == "O")
  {
    ui = "openSalesOrders";
    run = true;
  }
  else if (act == "P")
    ui = "packingListBatch";
  else if (act == "S")
  {
    ui = "maintainShipping";
    run = true;
  }
  else if (act == "B")
    ui = "uninvoicedShipments";
  else if (act == "I")
    ui = "dspBillingSelections";
  else if (act == "T")
    ui = "unpostedInvoices";

  // Open the window and perform any handling required
  toolbox.openWindow(ui);
  if (run)
    toolbox.lastWindow().sFillList();
}

/*!
  Adds actions to \a pMenu, typically from a right click on a Sales Activity item.
*/
function populateMenuSalesAct(pMenu, pItem)
{
  var menuItem;
  var act = pItem.rawValue("activity");
  var enable = privilegeCheckSalesAct(act);

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowSalesAct);
}

/*!
  Returns whether user has privileges to view detail on the selected Sales Activity.
*/
function privilegeCheckSalesAct(act)
{
  if (act == "Q") // Quote
    return privileges.check("ViewQuotes") || 
           privileges.check("MaintainQuotes")
  else if (act == "O") // Open Sales Orders
    return privileges.check("ViewSalesOrders") || 
           privileges.check("MaintainSalesOrders");
  else if (act == "P") // Packlist Batch
    return privileges.check("ViewPackingListBatch") || 
           privileges.check("MaintainPackingListBatch");
  else if (act == "S") // Shipping
    return privileges.check("ViewShipping");
  else if (act == "B" || 
           act == "I" || 
           act == "T") // Billing, Invoicing
    return privileges.check("SelectBilling");

  return false;
}




