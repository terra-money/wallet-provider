export type USBDeviceInfo = Pick<
  USBDevice,
  | 'deviceClass' // 0
  | 'deviceProtocol' // 0
  | 'deviceSubclass' // 0
  | 'deviceVersionMajor' // 2
  | 'deviceVersionMinor' // 0
  | 'deviceVersionSubminor' // 1
  | 'manufacturerName' // "Ledger"
  | 'productId' // 4113
  | 'productName' // "Nano S"
  | 'serialNumber' // "0001"
  | 'usbVersionMajor' // 2
  | 'usbVersionMinor' // 1
  | 'usbVersionSubminor' // 0
  | 'vendorId' // 11415
>;

//export interface USBDeviceInfo {
//  deviceClass: number; // 0
//  deviceProtocol: number; // 0
//  deviceSubclass: number; // 0
//  deviceVersionMajor: number; // 2
//  deviceVersionMinor: number; // 0
//  deviceVersionSubminor: number; // 1
//  manufacturerName?: string | undefined; // "Ledger"
//  productId: number; // 4113
//  productName?: string | undefined; // "Nano S"
//  serialNumber?: string | undefined; // "0001"
//  usbVersionMajor: number; // 2
//  usbVersionMinor: number; // 1
//  usbVersionSubminor: number; // 0
//  vendorId: number; // 11415
//}

export function pickUSBDeviceInfo(usbDevice: USBDevice): USBDeviceInfo {
  const {
    deviceClass,
    deviceProtocol,
    deviceSubclass,
    deviceVersionMajor,
    deviceVersionMinor,
    deviceVersionSubminor,
    manufacturerName,
    productId,
    productName,
    serialNumber,
    usbVersionMajor,
    usbVersionMinor,
    usbVersionSubminor,
    vendorId,
  } = usbDevice;

  return {
    deviceClass,
    deviceProtocol,
    deviceSubclass,
    deviceVersionMajor,
    deviceVersionMinor,
    deviceVersionSubminor,
    manufacturerName,
    productId,
    productName,
    serialNumber,
    usbVersionMajor,
    usbVersionMinor,
    usbVersionSubminor,
    vendorId,
  };
}

export function findUSBDevice<Device extends USBDeviceInfo>(
  info: USBDeviceInfo,
  devices: Device[],
): Device | undefined {
  return devices.find((device) => {
    return (
      device.deviceClass === info.deviceClass &&
      device.deviceProtocol === info.deviceProtocol &&
      device.deviceSubclass === info.deviceSubclass &&
      device.deviceVersionMajor === info.deviceVersionMajor &&
      device.deviceVersionMinor === info.deviceVersionMinor &&
      device.deviceVersionSubminor === info.deviceVersionSubminor &&
      device.manufacturerName === info.manufacturerName &&
      device.productId === info.productId &&
      device.productName === info.productName &&
      device.serialNumber === info.serialNumber &&
      device.usbVersionMajor === info.usbVersionMajor &&
      device.usbVersionMinor === info.usbVersionMinor &&
      device.usbVersionSubminor === info.usbVersionSubminor &&
      device.vendorId === info.vendorId
    );
  });
}

export function isEqualUSBDevices(a: USBDeviceInfo, b: USBDeviceInfo): boolean {
  return (
    a.deviceClass === b.deviceClass &&
    a.deviceProtocol === b.deviceProtocol &&
    a.deviceSubclass === b.deviceSubclass &&
    a.deviceVersionMajor === b.deviceVersionMajor &&
    a.deviceVersionMinor === b.deviceVersionMinor &&
    a.deviceVersionSubminor === b.deviceVersionSubminor &&
    a.manufacturerName === b.manufacturerName &&
    a.productId === b.productId &&
    a.productName === b.productName &&
    a.serialNumber === b.serialNumber &&
    a.usbVersionMajor === b.usbVersionMajor &&
    a.usbVersionMinor === b.usbVersionMinor &&
    a.usbVersionSubminor === b.usbVersionSubminor &&
    a.vendorId === b.vendorId
  );
}

export function subtractUSBDevices<Device extends USBDeviceInfo>(
  devices: Device[],
  subtractDevices: USBDeviceInfo[],
): Device[] {
  return devices.filter((device) => {
    return !subtractDevices.some((info) => {
      return isEqualUSBDevices(device, info);
    });
  });
}
