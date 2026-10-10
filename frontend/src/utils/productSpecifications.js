import {
  Cpu,
  HardDrive,
  Headphones,
  Keyboard,
  Layers,
  Monitor,
  Mouse,
  Sparkles,
  Wifi,
} from 'lucide-react';

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

const find = (pattern, value) => value.match(pattern)?.[0]?.trim() || '';

const formatCapacity = (value, unit) => `${value} ${unit.toUpperCase()}`;

/**
 * Build only specifications that can be read from this product's own name,
 * category, or description. Missing data stays hidden instead of being guessed.
 */
export function getProductSpecifications(product) {
  if (!product) return [];

  const savedSpecifications = product.specifications && typeof product.specifications === 'object'
    ? Object.entries(product.specifications).filter(([label, value]) => label?.trim() && value?.toString().trim())
    : [];
  if (savedSpecifications.length > 0) {
    return savedSpecifications.map(([label, value]) => ({
      label,
      value: String(value),
      icon: Layers,
      color: 'text-blue-600 bg-blue-50',
    }));
  }

  const name = product.name || '';
  const description = product.description || '';
  const source = `${name} ${description}`;
  const normalizedSource = normalize(source);
  const normalized = normalize(`${product.categoryName || ''} ${name} ${product.slug || ''}`);
  const isAccessory = /phu kien|accessory|mouse|chuot|keyboard|ban phim|headphone|tai nghe|airpods|buds/.test(normalized);
  const isTablet = /tablet|ipad|may tinh bang|galaxy tab/.test(normalized);
  const isPhone = !isTablet && /dien thoai|smartphone|iphone|galaxy|xiaomi|phone/.test(normalized);
  const isComputer = !isAccessory && !isTablet && !isPhone && /laptop|macbook|thinkpad|xps|zephyrus|rog|pc gaming|may tinh/.test(normalized);
  const specs = [];

  const add = (label, value, icon, color) => {
    if (value) specs.push({ label, value, icon, color });
  };

  if (isAccessory) {
    const kind = /headphone|tai nghe|airpods|buds/.test(normalized)
      ? ['Loại phụ kiện', 'Tai nghe', Headphones, 'text-violet-600 bg-violet-50']
      : /keyboard|ban phim/.test(normalized)
        ? ['Loại phụ kiện', 'Bàn phím', Keyboard, 'text-blue-600 bg-blue-50']
        : /mouse|chuot/.test(normalized)
          ? ['Loại phụ kiện', 'Chuột máy tính', Mouse, 'text-rose-600 bg-rose-50']
          : null;
    if (kind) add(...kind);

    const connection = find(/Bluetooth(?:\s+[\d.]+)?|2\.4\s*GHz|USB-?C|USB|wireless|khong day/i, normalizedSource)
      .replace(/khong day/i, 'Không dây');
    add('Kết nối', connection, Wifi, 'text-cyan-600 bg-cyan-50');

    const features = find(/Silent|RGB|Custom|hot-swappable|noise cancelling|chong on/i, source);
    add('Đặc điểm', features, Sparkles, 'text-amber-600 bg-amber-50');
    return specs;
  }

  const processor = find(
    /Apple\s+(?:M\d+\s*(?:Pro|Max|Ultra)?|A\d+\s*Pro?)|Snapdragon\s+[\w-]+(?:\s+Gen\s+\d+)?(?:\s+for\s+Galaxy)?|(?:Intel\s+)?Core\s+Ultra\s+\d+\s*\w*|(?:Intel\s+)?Core\s+i[3579](?:-\d{4,5}[A-Z]*)?|Ryzen\s+[3579]\s+[\w-]+|Dimensity\s+\d+|Exynos\s+\d+/i,
    source
  );
  add('Vi xử lý (CPU)', processor, Cpu, 'text-indigo-600 bg-indigo-50');

  const labeledMemory = find(/\b\d{1,3}\s*GB\s*(?:DDR[345](?:X)?|LPDDR[345](?:X)?|RAM)\b/i, source);
  const compactComputerMemory = isComputer ? name.match(/\b(\d{1,3})\s*GB\s*\//i) : null;
  const memory = labeledMemory || (compactComputerMemory ? `${compactComputerMemory[1]} GB` : '');
  add('Bộ nhớ RAM', memory, Layers, 'text-blue-600 bg-blue-50');

  let storage = find(/\b\d+(?:\.\d+)?\s*(?:TB|GB)\s*(?:(?:PCIe|NVMe)[\w\s.+-]*)?(?:SSD|NVMe|ROM|storage|lưu trữ)/i, source);
  if (!storage && (isPhone || isTablet || isComputer)) {
    const capacities = [...name.matchAll(/\b(\d+(?:\.\d+)?)\s*(TB|GB)\b/gi)];
    const capacity = capacities.at(-1);
    if (capacity) storage = formatCapacity(capacity[1], capacity[2]);
  }
  add('Dung lượng lưu trữ', storage, HardDrive, 'text-emerald-600 bg-emerald-50');

  const screenSize = find(/\b\d{1,2}(?:\.\d)?\s*(?:inch|inches|″|”|\")/i, source);
  const screenTech = find(/Liquid Retina XDR|Super Retina XDR|Dynamic AMOLED(?:\s+2X)?|Retina|AMOLED|OLED|WQHD\+?|2\.5K|2\.8K|3\.5K|4K/i, source);
  const refreshRate = find(/\b\d{2,3}\s*Hz\b/i, source);
  const display = [screenSize, screenTech, refreshRate].filter(Boolean).join(' · ');
  add('Màn hình', display, Monitor, 'text-cyan-600 bg-cyan-50');

  const graphics = find(/RTX\s*\d{4}(?:\s*Ti)?(?:\s*Super)?|Radeon\s+[\w\s]+|GPU\s+[\w-]+/i, source);
  add('Đồ họa', graphics, Monitor, 'text-fuchsia-600 bg-fuchsia-50');

  return specs;
}
