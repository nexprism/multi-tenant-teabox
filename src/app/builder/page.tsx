"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Grip,
  Image,
  FileText,
  BookOpen,
  Star,
  Settings,
  Eye,
  Plus,
  Trash2,
  Save,
  Layout,
  Move,
  Maximize2,
  X,
} from "lucide-react";
import {
  COMPONENT_TYPES,
  COMPONENT_VARIANTS,
  ComponentRenderer,
} from "./ComponentVariants";
import { fetchProductById } from "../store/slices/productSlice";
import { useDispatch } from "react-redux";
import { getImageUrl } from "@/app/utils/imageHelper";

// Sample product data
const sampleProduct = {
  name: "Premium Wirel",
  price: "$299.99",
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop",
  ],
  description:
    "Experience crystal-clear audio with our premium wireless headphones featuring advanced noise cancellation technology.",
  features: [
    "Bluetooth 5.0",
    "30-hour battery",
    "Quick charge",
    "Noise cancellation",
  ],
  howToUse:
    "Simply pair with your device via Bluetooth and enjoy high-quality audio. Use the touch controls for easy playbook management.",
  reviews: [
    { name: "John D.", rating: 5, comment: "Amazing sound quality!" },
    { name: "Sarah M.", rating: 4, comment: "Very comfortable for long use." },
    { name: "Mike R.", rating: 5, comment: "Best headphones I've owned." },
  ],
};

// Column width configurations (updated for 3 columns)
const COLUMN_WIDTHS = {
  1: { label: "1/3", class: "w-1/3", flex: "flex-[1]" },
  2: { label: "2/3", class: "w-2/3", flex: "flex-[2]" },
  3: { label: "3/3", class: "w-full", flex: "flex-[3]" },
};

// Component span options (updated for 3 columns)
const COMPONENT_SPANS = {
  1: { label: "1 Col", class: "col-span-1" },
  2: { label: "2 Cols", class: "col-span-2" },
  3: { label: "3 Cols", class: "col-span-3" },
};

// Gap configurations
const GAP_CLASSES = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

const SPACE_CLASSES = {
  0: "space-y-0",
  1: "space-y-1",
  2: "space-y-2",
  4: "space-y-4",
  6: "space-y-6",
  8: "space-y-8",
};

// Droppable column component
function DroppableColumn({
  id,
  children,
  title,
  isEmpty,
  width,
  onWidthChange,
  columnIndex,
  totalColumns = 3,
  onRemoveColumn,
  canRemove,
  componentGap = 2,
  isPreviewMode = false,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    backgroundColor: isOver && !isPreviewMode ? "#e0f2fe" : undefined,
    borderColor: isOver && !isPreviewMode ? "#0284c7" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${COLUMN_WIDTHS[width]?.flex} ${
        isPreviewMode ? "min-h-0" : "min-h-96"
      } ${
        isPreviewMode ? "" : "p-2 border-2 border-dashed"
      } transition-colors text-black ${
        !isPreviewMode && isEmpty
          ? "border-gray-300 bg-gray-50"
          : !isPreviewMode && !isEmpty
          ? "border-gray-200 bg-white"
          : ""
      } ${isOver && !isPreviewMode ? "border-blue-500 bg-blue-50" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex items-center justify-between gap-2 mb-4 p-2 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Layout size={16} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <span className="text-xs text-gray-500">
              ({children?.length || 0})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={width}
              onChange={(e) =>
                onWidthChange(columnIndex, parseInt(e.target.value))
              }
              className="text-xs border border-gray-300 rounded px-1 py-1 bg-white"
              title="Column Width"
            >
              {Object.entries(COLUMN_WIDTHS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            {canRemove && (
              <button
                onClick={() => onRemoveColumn(columnIndex)}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title={`Remove Column ${columnIndex + 1}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {isEmpty && !isPreviewMode ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Layout size={32} className="mb-2" />
          <p className="text-sm font-medium">Drop here</p>
          <p className="text-xs">Drag components</p>
        </div>
      ) : (
        <div
          className={
            isPreviewMode
              ? componentGap > 0
                ? SPACE_CLASSES[componentGap] || "space-y-2"
                : ""
              : SPACE_CLASSES[componentGap] || "space-y-2"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Full width component wrapper for spanning
function FullWidthComponent({ children, isFullWidth }) {
  if (isFullWidth) {
    return (
      <div className="w-full bg-white border border-gray-200 shadow-sm rounded-lg">
        <div className="w-full">{children}</div>
      </div>
    );
  }
  return children;
}

// Draggable component wrapper
function SortableItem({
  id,
  children,
  columnId,
  span = 1,
  totalColumns = 3,
  isPreviewMode = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { columnId, span },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isFullWidth = span === totalColumns;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isPreviewMode ? "" : "group"}`}
    >
      {!isPreviewMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-grab active:cursor-grabbing shadow-lg"
            title="Drag to move"
          >
            <Grip size={12} />
          </button>
        </div>
      )}
      <FullWidthComponent isFullWidth={isFullWidth}>
        {children}
      </FullWidthComponent>
    </div>
  );
}

// Individual component renderers (updated with full width styling and variants)
function ProductImages({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  isFullWidth = false,
  isPreviewMode = false,
}) {
  const imageSettings = settings[component.id] || {
    showThumbnails: true,
    imageSize: "medium",
    span: component.span || 1,
    variant: "classic",
  };

  const renderClassicVariant = () => (
    <div
      className={`flex ${isFullWidth ? "flex-row gap-4" : "flex-col"} gap-2`}
    >
      <div
        className={`${
          imageSettings.imageSize === "small"
            ? "max-w-24"
            : imageSettings.imageSize === "medium"
            ? "max-w-32"
            : isFullWidth
            ? "max-w-md"
            : "w-full"
        } ${isFullWidth ? "" : "mx-auto"}`}
      >
        <img
          src={getImageUrl(product.images[0])}
          alt="Main product"
          className="w-full h-auto rounded-lg object-cover"
        />
      </div>

      {imageSettings.showThumbnails && (
        <div
          className={`flex ${isFullWidth ? "flex-col" : "flex-row"} gap-1 ${
            isFullWidth ? "" : "justify-center"
          } overflow-x-auto`}
        >
          {product.images.slice(1).map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              alt={`Product ${idx + 2}`}
              className="w-8 h-8 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderGalleryVariant = () => (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <img
          src={getImageUrl(product.images[0])}
          alt="Main product"
          className="w-full h-auto rounded-lg object-cover"
        />
      </div>
      {product.images.slice(1, 3).map((img, idx) => (
        <img
          key={idx}
          src={getImageUrl(img)}
          alt={`Product ${idx + 2}`}
          className="w-full h-24 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
        />
      ))}
    </div>
  );

  const renderShowcaseVariant = () => (
    <div className="space-y-3">
      <div className="relative">
        <img
          src={getImageUrl(product.images[0])}
          alt="Main product"
          className="w-full h-64 rounded-lg object-cover"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Featured
        </div>
      </div>
      {imageSettings.showThumbnails && (
        <div className="flex gap-2 justify-center">
          {product.images.slice(1).map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              alt={`Product ${idx + 2}`}
              className="w-16 h-16 rounded border-2 border-transparent hover:border-blue-500 object-cover cursor-pointer transition-all"
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderVariant = () => {
    switch (imageSettings.variant) {
      case "gallery":
        return renderGalleryVariant();
      case "showcase":
        return renderShowcaseVariant();
      default:
        return renderClassicVariant();
    }
  };

  return (
    <div
      className={`${
        isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-lg shadow-lg border border-gray-200"
      } ${isPreviewMode ? "" : "p-3 mb-2"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Image size={16} />
            Product Images{" "}
            {isFullWidth && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Full Width
              </span>
            )}
          </h3>
          <div className="flex gap-1 items-center text-xs">
            <select
              value={imageSettings.variant}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...imageSettings,
                  variant: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
              title="Component Variant"
            >
              {Object.entries(COMPONENT_VARIANTS[COMPONENT_TYPES.IMAGES]).map(
                ([key, variant]) => (
                  <option key={key} value={key}>
                    {variant.label}
                  </option>
                )
              )}
            </select>
            <select
              value={imageSettings.span}
              onChange={(e) => {
                const newSpan = parseInt(e.target.value);
                onUpdateSpan(component.id, newSpan);
                onUpdateSettings(component.id, {
                  ...imageSettings,
                  span: newSpan,
                });
              }}
              className="text-xs border border-gray-300 rounded px-1 py-1"
              title="Component Span"
            >
              {Object.entries(COMPONENT_SPANS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={imageSettings.imageSize}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...imageSettings,
                  imageSize: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={imageSettings.showThumbnails}
                onChange={(e) =>
                  onUpdateSettings(component.id, {
                    ...imageSettings,
                    showThumbnails: e.target.checked,
                  })
                }
              />
              Thumbs
            </label>
          </div>
        </div>
      )}

      {renderVariant()}
    </div>
  );
}

function ProductDetails({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  isFullWidth = false,
  isPreviewMode = false,
}) {
  const detailSettings = settings[component.id] || {
    showPrice: true,
    showFeatures: true,
    layout: "vertical",
    span: component.span || 1,
    variant: "standard",
  };

  const renderStandardVariant = () => (
    <div
      className={`${
        detailSettings.layout === "horizontal" || isFullWidth
          ? "flex gap-3"
          : "space-y-2"
      }`}
    >
      <div className="flex-1">
        <h1
          className={`${
            isFullWidth ? "text-2xl" : "text-lg"
          } font-bold text-gray-900 mb-1`}
        >
          {product.name}
        </h1>
        {detailSettings.showPrice && (
          <p
            className={`${
              isFullWidth ? "text-xl" : "text-lg"
            } font-semibold text-blue-600 mb-2`}
          >
            {product.price}
          </p>
        )}
        <p
          className={`text-gray-700 ${
            isFullWidth ? "text-sm" : "text-xs"
          } leading-relaxed`}
        >
          {product.description}
        </p>
      </div>

      {detailSettings.showFeatures && (
        <div className="flex-1">
          <h4
            className={`font-semibold text-gray-900 mb-1 ${
              isFullWidth ? "text-sm" : "text-xs"
            }`}
          >
            Key Features:
          </h4>
          <ul className="space-y-1">
            {product.features.map((feature, idx) => (
              <li
                key={idx}
                className={`flex items-center gap-1 ${
                  isFullWidth ? "text-sm" : "text-xs"
                }`}
              >
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderDetailedVariant = () => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1
              className={`${
                isFullWidth ? "text-2xl" : "text-lg"
              } font-bold text-gray-900`}
            >
              {product.name}
            </h1>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              Premium
            </span>
          </div>
          {detailSettings.showPrice && (
            <div className="flex items-center gap-2 mb-2">
              <p
                className={`${
                  isFullWidth ? "text-xl" : "text-lg"
                } font-semibold text-blue-600`}
              >
                {product.price}
              </p>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                Limited Time
              </span>
            </div>
          )}
        </div>
      </div>

      <p
        className={`text-gray-700 ${
          isFullWidth ? "text-sm" : "text-xs"
        } leading-relaxed bg-gray-50 p-3 rounded-lg`}
      >
        {product.description}
      </p>

      {detailSettings.showFeatures && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4
            className={`font-semibold text-blue-900 mb-2 ${
              isFullWidth ? "text-sm" : "text-xs"
            }`}
          >
            ✨ Key Features:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {product.features.map((feature, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 ${
                  isFullWidth ? "text-sm" : "text-xs"
                } bg-white p-2 rounded`}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMinimalVariant = () => (
    <div className="text-center space-y-2">
      <h1
        className={`${
          isFullWidth ? "text-3xl" : "text-xl"
        } font-light text-gray-900 mb-2`}
      >
        {product.name}
      </h1>
      {detailSettings.showPrice && (
        <p
          className={`${
            isFullWidth ? "text-2xl" : "text-xl"
          } font-light text-gray-600 mb-3`}
        >
          {product.price}
        </p>
      )}
      <p
        className={`text-gray-600 ${
          isFullWidth ? "text-base" : "text-sm"
        } leading-relaxed max-w-md mx-auto`}
      >
        {product.description}
      </p>
      {detailSettings.showFeatures && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {product.features.map((feature, idx) => (
            <span
              key={idx}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
            >
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderVariant = () => {
    switch (detailSettings.variant) {
      case "detailed":
        return renderDetailedVariant();
      case "minimal":
        return renderMinimalVariant();
      default:
        return renderStandardVariant();
    }
  };

  return (
    <div
      className={`${
        isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-lg shadow-lg border border-gray-200"
      } ${isPreviewMode ? "" : "p-3 mb-2"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} />
            Product Details{" "}
            {isFullWidth && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Full Width
              </span>
            )}
          </h3>
          <div className="flex gap-1 items-center text-xs">
            <select
              value={detailSettings.variant}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...detailSettings,
                  variant: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
              title="Component Variant"
            >
              {Object.entries(COMPONENT_VARIANTS[COMPONENT_TYPES.DETAILS]).map(
                ([key, variant]) => (
                  <option key={key} value={key}>
                    {variant.label}
                  </option>
                )
              )}
            </select>
            <select
              value={detailSettings.span}
              onChange={(e) => {
                const newSpan = parseInt(e.target.value);
                onUpdateSpan(component.id, newSpan);
                onUpdateSettings(component.id, {
                  ...detailSettings,
                  span: newSpan,
                });
              }}
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              {Object.entries(COMPONENT_SPANS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={detailSettings.layout}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...detailSettings,
                  layout: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={detailSettings.showPrice}
                onChange={(e) =>
                  onUpdateSettings(component.id, {
                    ...detailSettings,
                    showPrice: e.target.checked,
                  })
                }
              />
              Price
            </label>
          </div>
        </div>
      )}

      {renderVariant()}
    </div>
  );
}

function HowToUse({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  isFullWidth = false,
  isPreviewMode = false,
}) {
  const howToUseSettings = settings[component.id] || {
    showIcon: true,
    bgColor: "blue",
    span: component.span || 1,
    variant: "simple",
  };

  const bgColors = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    gray: "bg-gray-50 border-gray-200",
  };

  const steps = [
    "Pair with your device via Bluetooth",
    "Enjoy high-quality audio",
    "Use touch controls for playback management",
  ];

  const renderStepsVariant = () => (
    <div className="space-y-3">
      <h4
        className={`font-semibold text-gray-900 mb-3 ${
          isFullWidth ? "text-base" : "text-sm"
        }`}
      >
        How to Use - Step by Step
      </h4>
      {steps.map((step, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {idx + 1}
          </div>
          <p
            className={`text-gray-700 ${
              isFullWidth ? "text-sm" : "text-xs"
            } leading-relaxed`}
          >
            {step}
          </p>
        </div>
      ))}
    </div>
  );

  const renderSimpleVariant = () => (
    <div
      className={`${bgColors[howToUseSettings.bgColor]} border rounded-lg p-2`}
    >
      <div className="flex items-start gap-2">
        {howToUseSettings.showIcon && (
          <BookOpen
            size={16}
            className={`text-${howToUseSettings.bgColor}-600 flex-shrink-0 mt-1`}
          />
        )}
        <div>
          <h4
            className={`font-semibold text-${
              howToUseSettings.bgColor
            }-900 mb-1 ${isFullWidth ? "text-sm" : "text-xs"}`}
          >
            Instructions
          </h4>
          <p
            className={`text-${howToUseSettings.bgColor}-800 ${
              isFullWidth ? "text-sm" : "text-xs"
            } leading-relaxed`}
          >
            {product.howToUse}
          </p>
        </div>
      </div>
    </div>
  );

  const renderIllustratedVariant = () => (
    <div className="space-y-4">
      <h4
        className={`font-semibold text-gray-900 text-center mb-4 ${
          isFullWidth ? "text-base" : "text-sm"
        }`}
      >
        📱 Quick Start Guide
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "🔗", title: "Connect", desc: "Pair via Bluetooth" },
          { icon: "🎵", title: "Play", desc: "Enjoy audio" },
          { icon: "🎛️", title: "Control", desc: "Touch controls" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="text-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h5
              className={`font-semibold text-gray-900 mb-1 ${
                isFullWidth ? "text-sm" : "text-xs"
              }`}
            >
              {item.title}
            </h5>
            <p
              className={`text-gray-600 ${isFullWidth ? "text-xs" : "text-xs"}`}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVariant = () => {
    switch (howToUseSettings.variant) {
      case "steps":
        return renderStepsVariant();
      case "illustrated":
        return renderIllustratedVariant();
      default:
        return renderSimpleVariant();
    }
  };

  return (
    <div
      className={`${
        isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-lg shadow-lg border border-gray-200"
      } ${isPreviewMode ? "" : "p-3 mb-2"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen size={16} />
            How to Use{" "}
            {isFullWidth && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Full Width
              </span>
            )}
          </h3>
          <div className="flex gap-1 items-center text-xs">
            <select
              value={howToUseSettings.variant}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...howToUseSettings,
                  variant: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
              title="Component Variant"
            >
              {Object.entries(
                COMPONENT_VARIANTS[COMPONENT_TYPES.HOW_TO_USE]
              ).map(([key, variant]) => (
                <option key={key} value={key}>
                  {variant.label}
                </option>
              ))}
            </select>
            <select
              value={howToUseSettings.span}
              onChange={(e) => {
                const newSpan = parseInt(e.target.value);
                onUpdateSpan(component.id, newSpan);
                onUpdateSettings(component.id, {
                  ...howToUseSettings,
                  span: newSpan,
                });
              }}
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              {Object.entries(COMPONENT_SPANS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={howToUseSettings.bgColor}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...howToUseSettings,
                  bgColor: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="gray">Gray</option>
            </select>
          </div>
        </div>
      )}

      {renderVariant()}
    </div>
  );
}

function Reviews({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  isFullWidth = false,
  isPreviewMode = false,
}) {
  const reviewSettings = settings[component.id] || {
    showRating: true,
    maxReviews: 3,
    layout: "card",
    span: component.span || 1,
    variant: "cards",
  };

  const displayReviews = product.reviews.slice(0, reviewSettings.maxReviews);

  const renderCardsVariant = () => (
    <div className={`${isFullWidth ? "grid grid-cols-3 gap-4" : "space-y-2"}`}>
      {displayReviews.map((review, idx) => (
        <div key={idx} className="bg-gray-50 p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`font-medium text-gray-900 ${
                isFullWidth ? "text-sm" : "text-xs"
              }`}
            >
              {review.name}
            </span>
            {reviewSettings.showRating && (
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < review.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <p
            className={`text-gray-700 ${
              isFullWidth ? "text-sm" : "text-xs"
            } leading-relaxed`}
          >
            &ldquo;{review.comment}&rdquo;
          </p>
        </div>
      ))}
    </div>
  );

  const renderListVariant = () => (
    <div className="space-y-3">
      {displayReviews.map((review, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-2 border-l-4 border-blue-500 bg-blue-50"
        >
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {review.name.charAt(0)}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-medium text-gray-900 ${
                  isFullWidth ? "text-sm" : "text-xs"
                }`}
              >
                {review.name}
              </span>
              {reviewSettings.showRating && (
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={
                        i < review.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
              )}
            </div>
            <p
              className={`text-gray-700 ${
                isFullWidth ? "text-sm" : "text-xs"
              } leading-relaxed`}
            >
              {review.comment}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTestimonialVariant = () => {
    const featuredReview = displayReviews[0];
    if (!featuredReview) return null;

    return (
      <div className="text-center space-y-4">
        <div className="text-4xl text-gray-300 mb-2">&ldquo;</div>
        <blockquote
          className={`${
            isFullWidth ? "text-lg" : "text-base"
          } font-medium text-gray-900 italic leading-relaxed`}
        >
          {featuredReview.comment}
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
            {featuredReview.name.charAt(0)}
          </div>
          <div className="text-left">
            <div
              className={`font-medium text-gray-900 ${
                isFullWidth ? "text-sm" : "text-xs"
              }`}
            >
              {featuredReview.name}
            </div>
            {reviewSettings.showRating && (
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < featuredReview.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {displayReviews.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {displayReviews.slice(1).map((review, idx) => (
              <div key={idx} className="w-2 h-2 bg-gray-300 rounded-full"></div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVariant = () => {
    switch (reviewSettings.variant) {
      case "list":
        return renderListVariant();
      case "testimonial":
        return renderTestimonialVariant();
      default:
        return renderCardsVariant();
    }
  };

  return (
    <div
      className={`${
        isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-lg shadow-lg border border-gray-200"
      } ${isPreviewMode ? "" : "p-3 mb-2"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Star size={16} />
            Reviews{" "}
            {isFullWidth && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Full Width
              </span>
            )}
          </h3>
          <div className="flex gap-1 items-center text-xs">
            <select
              value={reviewSettings.variant}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...reviewSettings,
                  variant: e.target.value,
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
              title="Component Variant"
            >
              {Object.entries(COMPONENT_VARIANTS[COMPONENT_TYPES.REVIEWS]).map(
                ([key, variant]) => (
                  <option key={key} value={key}>
                    {variant.label}
                  </option>
                )
              )}
            </select>
            <select
              value={reviewSettings.span}
              onChange={(e) => {
                const newSpan = parseInt(e.target.value);
                onUpdateSpan(component.id, newSpan);
                onUpdateSettings(component.id, {
                  ...reviewSettings,
                  span: newSpan,
                });
              }}
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              {Object.entries(COMPONENT_SPANS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={reviewSettings.maxReviews}
              onChange={(e) =>
                onUpdateSettings(component.id, {
                  ...reviewSettings,
                  maxReviews: parseInt(e.target.value),
                })
              }
              className="text-xs border border-gray-300 rounded px-1 py-1"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>
      )}

      {renderVariant()}
    </div>
  );
}

// Component renderer - delegated to componentVariants.tsx
// (Note: ComponentRenderer is imported from componentVariants.tsx)

// Available components sidebar
function ComponentLibrary({
  onAddComponent,
  sections,
  columnGap,
  componentGap,
  rowGap,
}) {
  const availableComponents = [
    { type: COMPONENT_TYPES.IMAGES, title: "Product Images", icon: Image },
    { type: COMPONENT_TYPES.DETAILS, title: "Product Details", icon: FileText },
    { type: COMPONENT_TYPES.HOW_TO_USE, title: "How to Use", icon: BookOpen },
    { type: COMPONENT_TYPES.REVIEWS, title: "Customer Reviews", icon: Star },
  ];

  // Get all existing component types across all sections
  const existingTypes = sections.flatMap((section) =>
    section.type === "columns"
      ? section.columns.flatMap((col) =>
          col.components.map((comp) => comp.type)
        )
      : []
  );

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Components</h2>
      <div className="space-y-2">
        {availableComponents.map((comp) => {
          const IconComponent = comp.icon;
          const isAdded = existingTypes.includes(comp.type);

          return (
            <button
              key={comp.type}
              onClick={() => onAddComponent(comp.type, comp.title)}
              disabled={isAdded}
              className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                isAdded
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
              }`}
            >
              <IconComponent
                size={16}
                className={isAdded ? "text-gray-400" : "text-gray-600"}
              />
              <span
                className={`font-medium text-sm ${
                  isAdded ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {comp.title}
              </span>
              {isAdded ? (
                <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Added
                </span>
              ) : (
                <Plus size={14} className="ml-auto text-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">Features</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Multiple component variants</li>
          <li>• Multiple column sections</li>
          <li>• 3 adjustable columns per section</li>
          <li>• Component spanning</li>
          <li>• Drag & drop ordering</li>
          <li>• Width customization</li>
          <li>• Remove columns/sections</li>
          <li>• Full width components</li>
          <li>• Adjustable gaps</li>
          <li>• Section-based layout</li>
        </ul>
      </div>

      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2 text-sm">
          Component Variants
        </h3>
        <div className="text-xs text-green-800 space-y-2">
          <div>
            <div className="font-medium">Images:</div>
            <div className="pl-2">Classic, Gallery, Showcase</div>
          </div>
          <div>
            <div className="font-medium">Details:</div>
            <div className="pl-2">Standard, Detailed, Minimal</div>
          </div>
          <div>
            <div className="font-medium">How to Use:</div>
            <div className="pl-2">Simple, Steps, Illustrated</div>
          </div>
          <div>
            <div className="font-medium">Reviews:</div>
            <div className="pl-2">Cards, List, Testimonial</div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">
          Current Configuration
        </h3>
        <div className="text-xs text-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>Total Sections:</span>
            <span className="font-medium">{sections.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Column Gap:</span>
            <span className="font-medium">
              {columnGap === 0
                ? "None"
                : columnGap === 1
                ? "XS"
                : columnGap === 2
                ? "SM"
                : columnGap === 4
                ? "MD"
                : columnGap === 6
                ? "LG"
                : "XL"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Component Gap:</span>
            <span className="font-medium">
              {componentGap === 0
                ? "None"
                : componentGap === 1
                ? "XS"
                : componentGap === 2
                ? "SM"
                : componentGap === 4
                ? "MD"
                : componentGap === 6
                ? "LG"
                : "XL"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Row Gap:</span>
            <span className="font-medium">
              {rowGap === 0
                ? "None"
                : rowGap === 1
                ? "XS"
                : rowGap === 2
                ? "SM"
                : rowGap === 4
                ? "MD"
                : rowGap === 6
                ? "LG"
                : "XL"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page builder component
export default function ProductPageBuilder() {
  const [sections, setSections] = useState([
    {
      id: "section-1",
      type: "columns",
      order: 0,
      columns: [
        {
          id: "column-1",
          width: 1,
          components: [
            {
              id: "1",
              type: COMPONENT_TYPES.IMAGES,
              title: "Product Images",
              span: 1,
              order: 0,
            },
          ],
        },
        {
          id: "column-2",
          width: 2,
          components: [
            {
              id: "2",
              type: COMPONENT_TYPES.DETAILS,
              title: "Product Details",
              span: 1,
              order: 1,
            },
          ],
        },
        {
          id: "column-3",
          width: 1,
          components: [
            {
              id: "3",
              type: COMPONENT_TYPES.HOW_TO_USE,
              title: "How to Use",
              span: 1,
              order: 2,
            },
          ],
        },
      ],
    },
  ]);

  // Legacy columns state for backward compatibility - derived from sections
  const columns = useMemo(() => {
    const allColumns = sections
      .filter((s) => s.type === "columns")
      .flatMap((s) => s.columns);
    return allColumns;
  }, [sections]);

  const [componentSettings, setComponentSettings] = useState({});
  const isPreviewMode = true;
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnGap, setColumnGap] = useState(2); // Gap between columns (0-8)
  const [componentGap, setComponentGap] = useState(2); // Gap between components (0-8)
  const [rowGap, setRowGap] = useState(4); // Gap between rows (0-8)
  const [product, setProduct] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [templateId, setTemplateId] = useState("688b2517677656ae9f8a73aa"); // Default template ID
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  // Use ref to track current sections for drag operations
  const sectionsRef = useRef(sections);

  // Update ref whenever sections change
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;

      if (isDragging) return; // Prevent double execution
      setIsDragging(true);

      for (const section of sectionsRef.current) {
        if (section.type === "columns") {
          for (const column of section.columns) {
            const component = column.components.find((c) => c.id === active.id);
            if (component) {
              setDraggedComponent(component);
              return;
            }
          }
        }
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setDraggedComponent(null);
    setIsDragging(false);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setSections((prevSections) => {
      const newSections = [...prevSections];

      // Find source component across all sections
      let sourceSection = null;
      let sourceColumnIndex = -1;
      let sourceComponent = null;
      let sourceComponentIndex = -1;
      let sourceSectionIndex = -1;

      for (let sIdx = 0; sIdx < newSections.length; sIdx++) {
        const section = newSections[sIdx];
        if (section.type === "columns") {
          for (let i = 0; i < section.columns.length; i++) {
            const componentIndex = section.columns[i].components.findIndex(
              (c) => c.id === activeId
            );
            if (componentIndex !== -1) {
              sourceSectionIndex = sIdx;
              sourceSection = section;
              sourceColumnIndex = i;
              sourceComponent = section.columns[i].components[componentIndex];
              sourceComponentIndex = componentIndex;
              break;
            }
          }
          if (sourceComponent) break;
        }
      }

      if (!sourceComponent) return prevSections;

      // Find target position across all sections
      let targetSection = null;
      let targetColumnIndex = -1;
      let targetComponentIndex = -1;
      let targetComponent = null;
      let targetSectionIndex = -1;

      // Check if dropping on a column
      for (let sIdx = 0; sIdx < newSections.length; sIdx++) {
        const section = newSections[sIdx];
        if (section.type === "columns") {
          for (let i = 0; i < section.columns.length; i++) {
            if (section.columns[i].id === overId) {
              targetSectionIndex = sIdx;
              targetSection = section;
              targetColumnIndex = i;
              targetComponentIndex = section.columns[i].components.length;
              break;
            }
          }
          if (targetSection) break;
        }
      }

      // If not dropping on a column, check if dropping on a component
      if (!targetSection) {
        for (let sIdx = 0; sIdx < newSections.length; sIdx++) {
          const section = newSections[sIdx];
          if (section.type === "columns") {
            for (let i = 0; i < section.columns.length; i++) {
              const componentIndex = section.columns[i].components.findIndex(
                (c) => c.id === overId
              );
              if (componentIndex !== -1) {
                targetSectionIndex = sIdx;
                targetSection = section;
                targetColumnIndex = i;
                targetComponentIndex = componentIndex;
                targetComponent = section.columns[i].components[componentIndex];
                break;
              }
            }
            if (targetSection) break;
          }
        }
      }

      if (targetSectionIndex === -1) return prevSections;

      // Calculate new order based on target position
      let newOrder;
      if (targetComponent) {
        // Get all components from target section sorted by order
        const targetSectionComponents = newSections[
          targetSectionIndex
        ].columns.flatMap((col) => col.components);
        targetSectionComponents.sort((a, b) => (a.order || 0) - (b.order || 0));

        const targetOrder = targetComponent.order || 0;
        const targetIndex = targetSectionComponents.findIndex(
          (c) => c.id === targetComponent.id
        );

        // Insert before the target component
        if (targetIndex === 0) {
          newOrder = targetOrder - 1;
        } else {
          const prevOrder = targetSectionComponents[targetIndex - 1].order || 0;
          newOrder = (prevOrder + targetOrder) / 2;
        }
      } else {
        // Dropping at end of column, get highest order in target section + 1
        const targetSectionComponents = newSections[
          targetSectionIndex
        ].columns.flatMap((col) => col.components);
        const maxOrder = Math.max(
          ...targetSectionComponents.map((comp) => comp.order || 0),
          -1
        );
        newOrder = maxOrder + 1;
      }

      // Update component order
      const updatedComponent = { ...sourceComponent, order: newOrder };

      // Remove from source
      newSections[sourceSectionIndex].columns[
        sourceColumnIndex
      ].components.splice(sourceComponentIndex, 1);

      // Add to target
      if (updatedComponent.span === 3) {
        // For full-width components, always add to first column of target section
        newSections[targetSectionIndex].columns[0].components.push(
          updatedComponent
        );
      } else {
        // Add to target column
        newSections[targetSectionIndex].columns[
          targetColumnIndex
        ].components.splice(targetComponentIndex, 0, updatedComponent);
      }

      return newSections;
    });
  }, []);

  const removeSection = useCallback(
    (sectionId) => {
      if (sections.length <= 1) {
        alert(
          "Cannot remove the last section! At least one section is required."
        );
        return;
      }

      const confirmRemove = window.confirm(
        "Are you sure you want to remove this section? All components in this section will be lost."
      );

      if (!confirmRemove) return;

      setSections((prevSections) => {
        return prevSections.filter((section) => section.id !== sectionId);
      });
    },
    [sections.length]
  );

  const addComponent = useCallback((type, title) => {
    setSections((prevSections) => {
      // Check if this component type already exists across all sections
      const allComponents = prevSections.flatMap((section) =>
        section.type === "columns"
          ? section.columns.flatMap((col) => col.components)
          : []
      );

      const existingComponent = allComponents.find(
        (comp) => comp.type === type
      );

      if (existingComponent) {
        alert(
          `A ${title} component already exists! Each component type can only be added once.`
        );
        return prevSections;
      }

      // Get the next order number
      const maxOrder = Math.max(
        ...allComponents.map((comp) => comp.order || 0),
        -1
      );
      const nextOrder = maxOrder + 1;

      const newId = `${type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newComponent = {
        id: newId,
        type,
        title,
        span: 1,
        order: nextOrder,
      };

      // Add to first column of first section by default
      const newSections = [...prevSections];
      const firstColumnSection = newSections.find((s) => s.type === "columns");

      if (firstColumnSection) {
        const sectionIndex = newSections.findIndex(
          (s) => s.id === firstColumnSection.id
        );
        newSections[sectionIndex] = {
          ...firstColumnSection,
          columns: [
            {
              ...firstColumnSection.columns[0],
              components: [
                ...firstColumnSection.columns[0].components,
                newComponent,
              ],
            },
            ...firstColumnSection.columns.slice(1),
          ],
        };
      }

      // Set default variant for new component
      setComponentSettings((prev) => ({
        ...prev,
        [newId]: {
          variant: Object.keys(COMPONENT_VARIANTS[type] || {})[0] || "default",
        },
      }));

      return newSections;
    });
  }, []);

  const removeComponent = useCallback((id) => {
    setSections((prevSections) => {
      return prevSections.map((section) => {
        if (section.type === "columns") {
          return {
            ...section,
            columns: section.columns.map((column) => ({
              ...column,
              components: column.components.filter((comp) => comp.id !== id),
            })),
          };
        }
        return section;
      });
    });

    setComponentSettings((prev) => {
      const newSettings = { ...prev };
      delete newSettings[id];
      return newSettings;
    });
  }, []);

  const removeColumn = useCallback((sectionId, columnIndex) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const sectionIdx = newSections.findIndex((s) => s.id === sectionId);
      const section = newSections[sectionIdx];

      if (section.columns.length <= 1) {
        alert(
          "Cannot remove the last column! At least one column is required."
        );
        return prevSections;
      }

      const confirmRemove = window.confirm(
        `Are you sure you want to remove Column ${columnIndex + 1}? ${
          section.columns[columnIndex].components.length > 0
            ? "Its components will be moved to the first column."
            : ""
        }`
      );

      if (!confirmRemove) return prevSections;

      const removedColumn = section.columns[columnIndex];
      const newColumns = [...section.columns];

      // Move components from removed column to the first remaining column
      if (removedColumn.components.length > 0) {
        if (columnIndex === 0 && newColumns.length > 1) {
          // If removing first column, move components to the new first column (current second)
          newColumns[1] = {
            ...newColumns[1],
            components: [
              ...removedColumn.components,
              ...newColumns[1].components,
            ],
          };
        } else {
          // Otherwise move to first column
          newColumns[0] = {
            ...newColumns[0],
            components: [
              ...newColumns[0].components,
              ...removedColumn.components,
            ],
          };
        }
      }

      // Remove the column
      newColumns.splice(columnIndex, 1);

      // Update column IDs to maintain sequential numbering
      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        id: `column-${sectionId}-${index + 1}`,
      }));

      newSections[sectionIdx] = {
        ...section,
        columns: updatedColumns,
      };

      return newSections;
    });
  }, []);

  const updateComponentSettings = useCallback((componentId, settings) => {
    setComponentSettings((prev) => ({
      ...prev,
      [componentId]: settings,
    }));
  }, []);

  const updateComponentSpan = useCallback((componentId, span) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];

      // Find the component across all sections
      let found = false;
      for (let sIdx = 0; sIdx < newSections.length && !found; sIdx++) {
        const section = newSections[sIdx];
        if (section.type === "columns") {
          for (let i = 0; i < section.columns.length && !found; i++) {
            const idx = section.columns[i].components.findIndex(
              (c) => c.id === componentId
            );
            if (idx !== -1) {
              const component = section.columns[i].components[idx];
              const updatedComponent = { ...component, span };

              // If changing to full width (span 3), move to first column of section
              if (span === 3 && i !== 0) {
                // Remove from current column
                newSections[sIdx].columns[i].components.splice(idx, 1);
                // Add to first column
                newSections[sIdx].columns[0].components.push(updatedComponent);
              } else if (span !== 3 && i === 0 && component.span === 3) {
                // If changing from full width to normal, keep in first column but update span
                newSections[sIdx].columns[i].components[idx] = updatedComponent;
              } else {
                // Just update the span in current position
                newSections[sIdx].columns[i].components[idx] = updatedComponent;
              }
              found = true;
            }
          }
        }
      }

      return newSections;
    });
  }, []);

  const updateColumnWidth = useCallback((sectionId, columnIndex, width) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const sectionIdx = newSections.findIndex((s) => s.id === sectionId);
      if (sectionIdx !== -1) {
        newSections[sectionIdx].columns[columnIndex].width = width;
      }
      return newSections;
    });
  }, []);

  const addNewSection = useCallback(() => {
    setSections((prevSections) => {
      const maxOrder = Math.max(
        ...prevSections.map((section) => section.order || 0),
        -1
      );
      const newSectionId = `section-${Date.now()}`;

      const newSection = {
        id: newSectionId,
        type: "columns",
        order: maxOrder + 1,
        columns: [
          {
            id: `column-${newSectionId}-1`,
            width: 1,
            components: [],
          },
          {
            id: `column-${newSectionId}-2`,
            width: 2,
            components: [],
          },
          {
            id: `column-${newSectionId}-3`,
            width: 1,
            components: [],
          },
        ],
      };

      return [...prevSections, newSection];
    });
  }, []);

  const addColumn = useCallback(() => {
    // Find the last column section and add a column to it
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const lastColumnSection = [...newSections]
        .reverse()
        .find((s) => s.type === "columns");

      if (!lastColumnSection || lastColumnSection.columns.length >= 3) {
        alert(
          "Maximum 3 columns per section allowed! Add a new section instead."
        );
        return prevSections;
      }

      const sectionIndex = newSections.findIndex(
        (s) => s.id === lastColumnSection.id
      );
      const newColumnId = `column-${lastColumnSection.id}-${
        lastColumnSection.columns.length + 1
      }`;

      newSections[sectionIndex] = {
        ...lastColumnSection,
        columns: [
          ...lastColumnSection.columns,
          {
            id: newColumnId,
            width: 1,
            components: [],
          },
        ],
      };

      return newSections;
    });
  }, []);

  // Function to organize sections for rendering
  const organizeSectionsForRender = useCallback(() => {
    // Sort sections by order
    const sortedSections = [...sections].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    const renderSections = [];

    for (const section of sortedSections) {
      if (section.type === "columns") {
        // Get all components from this section and organize them into rows
        const allComponents = section.columns.flatMap((col, colIndex) =>
          col.components.map((comp) => ({
            ...comp,
            originalColumnIndex: colIndex,
            sectionId: section.id,
          }))
        );

        // Sort components by order
        allComponents.sort((a, b) => (a.order || 0) - (b.order || 0));

        const rows = [];
        let currentRowComponents = [];
        let currentRowByColumn = Array(section.columns.length)
          .fill(null)
          .map(() => []);

        for (const component of allComponents) {
          if (component.span === 3) {
            // If we have components in current row, close it
            if (currentRowComponents.length > 0) {
              rows.push({
                type: "columns",
                components: currentRowComponents,
                columns: currentRowByColumn,
                sectionId: section.id,
                sectionColumns: section.columns,
              });
              currentRowComponents = [];
              currentRowByColumn = Array(section.columns.length)
                .fill(null)
                .map(() => []);
            }

            // Add full-width component as its own row
            rows.push({
              type: "fullWidth",
              component: component,
              sectionId: section.id,
            });
          } else {
            // Add to current row
            currentRowComponents.push(component);
            currentRowByColumn[component.originalColumnIndex].push(component);
          }
        }

        // Add remaining components as the last row
        if (currentRowComponents.length > 0) {
          rows.push({
            type: "columns",
            components: currentRowComponents,
            columns: currentRowByColumn,
            sectionId: section.id,
            sectionColumns: section.columns,
          });
        }

        // If no rows, add empty row for drag and drop
        if (rows.length === 0) {
          rows.push({
            type: "columns",
            components: [],
            columns: Array(section.columns.length)
              .fill(null)
              .map(() => []),
            sectionId: section.id,
            sectionColumns: section.columns,
          });
        }

        renderSections.push(...rows);
      }
    }

    return renderSections;
  }, [sections]);

  const handleSave = useCallback(() => {
    const config = {
      sections,
      settings: componentSettings,
      gaps: {
        columnGap,
        componentGap,
        rowGap,
      },
    };
    //consolle.log("Saving page configuration:", config);
    alert("Page configuration saved! Check //consolle for details.");
  }, [sections, componentSettings, columnGap, componentGap, rowGap]);

  const dispatch = useDispatch();
  const getProductData = useCallback(async () => {
    try {
      const response = await dispatch(
        fetchProductById("vedicroots-ginger-green-tea")
      );

      //consolle.log("Fetched Product Data:", response.payload);
      setProduct(response.payload);
    } catch (error) {
      //consolle.error("Error fetching product data:", error);
    }
  }, [dispatch]);

  // Function to transform template data to sections format
  const transformTemplateToSections = useCallback((template) => {
    //consolle.log("transformTemplateToSections called with:", template);

    if (!template || !template.columns) {
      //consolle.error("Invalid template data:", template);
      //consolle.error("Template is null:", !template);
      //consolle.error("Template columns missing:", template && !template.columns);
      return;
    }

    //consolle.log("Template has", template.columns.length, "columns");
    template.columns.forEach((col, index) => {
      //consolle.log(`Column ${index}:`, col);
      //consolle.log(`Column ${index} components:`, col.components);
    });

    // Helper function to map template component types to existing component types
    const mapTemplateComponentType = (templateType) => {
      const typeMapping = {
        gallery: COMPONENT_TYPES.IMAGES,
        images: COMPONENT_TYPES.IMAGES,
        carousel: COMPONENT_TYPES.IMAGES,
        heading: COMPONENT_TYPES.DETAILS,
        price: COMPONENT_TYPES.DETAILS,
        rating: COMPONENT_TYPES.DETAILS,
        details: COMPONENT_TYPES.DETAILS,
        description: COMPONENT_TYPES.DETAILS,
        text: COMPONENT_TYPES.DETAILS,
        quantity: COMPONENT_TYPES.HOW_TO_USE,
        button: COMPONENT_TYPES.HOW_TO_USE,
        howToUse: COMPONENT_TYPES.HOW_TO_USE,
        instructions: COMPONENT_TYPES.HOW_TO_USE,
        actions: COMPONENT_TYPES.HOW_TO_USE,
        reviews: COMPONENT_TYPES.REVIEWS,
        testimonial: COMPONENT_TYPES.REVIEWS,
        stars: COMPONENT_TYPES.REVIEWS,
      };
      return typeMapping[templateType] || COMPONENT_TYPES.DETAILS;
    };

    // Helper function to get component title based on type
    const getComponentTitle = (templateType) => {
      const titleMapping = {
        gallery: "Product Images",
        images: "Product Images",
        carousel: "Product Images",
        heading: "Product Details",
        price: "Product Details",
        rating: "Product Details",
        details: "Product Details",
        description: "Product Details",
        text: "Product Details",
        quantity: "How to Use",
        button: "How to Use",
        howToUse: "How to Use",
        instructions: "How to Use",
        actions: "How to Use",
        reviews: "Reviews",
        testimonial: "Reviews",
        stars: "Reviews",
      };
      return titleMapping[templateType] || "Product Details";
    };

    // Update gaps from template
    setColumnGap(Math.min(Math.max(template.columnGap || 20, 0) / 4, 8)); // Convert px to tailwind scale
    setComponentGap(Math.min(Math.max(template.componentGap || 16, 0) / 4, 8));
    setRowGap(Math.min(Math.max(template.rowGap || 24, 0) / 4, 8));

    // Create new section based on template
    const newSection = {
      id: `section-template-${Date.now()}`,
      type: "columns",
      order: 0,
      columns: template.columns.map((templateColumn, index) => ({
        id: `column-template-${index + 1}`,
        width: Math.ceil((templateColumn.columnWidth || 33) / 33), // Convert percentage to 1-3 scale
        components: templateColumn.components.map(
          (templateComponent, compIndex) => ({
            id: `component-template-${index}-${compIndex}`,
            type: mapTemplateComponentType(templateComponent.componentType),
            title: getComponentTitle(templateComponent.componentType),
            span: Math.min(
              Math.max(
                Math.ceil((templateComponent.componentSpan || 12) / 4),
                1
              ),
              3
            ), // Convert 12-grid to 3-grid
            order: templateComponent.sortOrder || compIndex,
            templateSettings: templateComponent.settings || {},
            isVisible: templateComponent.isVisible !== false,
            variant: templateComponent.componentVariant || "default",
          })
        ),
      })),
    };

    // Replace current sections with template-based section
    //consolle.log("New section created:", newSection);
    setSections([newSection]);
    //consolle.log("Sections updated with template data");

    // Set component settings based on template
    const newComponentSettings = {};
    template.columns.forEach((templateColumn, columnIndex) => {
      templateColumn.components.forEach((templateComponent, compIndex) => {
        const componentId = `component-template-${columnIndex}-${compIndex}`;
        newComponentSettings[componentId] = {
          variant: templateComponent.componentVariant || "default",
          ...templateComponent.settings,
        };
      });
    });
    //consolle.log("New component settings:", newComponentSettings);
    setComponentSettings(newComponentSettings);
  }, []);

  // Function to fetch template data from API
  const fetchTemplateData = useCallback(
    async (templateId) => {
      setIsLoadingTemplate(true);
      try {
        const response = await fetch(`/api/template/${templateId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.statusText}`);
        }
        const templateData = await response.json();
        //consolle.log("Fetched Template Data:", templateData);
        //consolle.log("Template data type:", typeof templateData);
        //consolle.log("Template columns:", templateData?.columns);
        //consolle.log(
        //   "Template structure:",
        //   JSON.stringify(templateData, null, 2)
        // );
        setTemplateData(templateData);

        // Check if templateData has the expected structure
        if (templateData && templateData.data) {
          // If API returns data wrapped in a 'data' property
          transformTemplateToSections(templateData.data);
        } else if (templateData) {
          // If API returns template data directly
          transformTemplateToSections(templateData);
        } else {
          //consolle.error("Template data is null or undefined");
          alert("Invalid template data received");
        }
      } catch (error) {
        //consolle.error("Error fetching template data:", error);
        alert("Failed to load template. Please try again.");
      } finally {
        setIsLoadingTemplate(false);
      }
    },
    [transformTemplateToSections]
  );

  // Function to load template (can be called from UI)
  const loadTemplate = useCallback(() => {
    if (templateId) {
      fetchTemplateData(templateId);
    } else {
      alert("Please enter a template ID");
    }
  }, [templateId, fetchTemplateData]);

  // Test function to load mock template data for debugging
  const loadMockTemplate = useCallback(() => {
    const mockTemplateData = {
      productId: 67890,
      layoutId: 2,
      layoutName: "Advanced Product Layout",
      totalColumns: 3,
      columnGap: 30,
      componentGap: 20,
      rowGap: 30,
      columns: [
        {
          columnIndex: 0,
          columnWidth: 50,
          columnTitle: "Product Gallery",
          components: [
            {
              componentType: "gallery",
              componentVariant: "carousel",
              componentSpan: 12,
              sortOrder: 1,
              isVisible: true,
              settings: {
                autoplay: true,
                showThumbnails: true,
                transition: "slide",
              },
            },
          ],
        },
        {
          columnIndex: 1,
          columnWidth: 30,
          columnTitle: "Product Details",
          components: [
            {
              componentType: "heading",
              componentVariant: "h1",
              componentSpan: 12,
              sortOrder: 1,
              isVisible: true,
              settings: {
                fontSize: "28px",
                fontWeight: "bold",
                margin: "0 0 16px 0",
              },
            },
            {
              componentType: "price",
              componentVariant: "standard",
              componentSpan: 12,
              sortOrder: 2,
              isVisible: true,
              settings: {
                currency: "USD",
                showDiscount: true,
                fontSize: "24px",
              },
            },
          ],
        },
        {
          columnIndex: 2,
          columnWidth: 20,
          columnTitle: "Actions",
          components: [
            {
              componentType: "button",
              componentVariant: "primary",
              componentSpan: 12,
              sortOrder: 1,
              isVisible: true,
              settings: {
                text: "Add to Cart",
                size: "large",
                fullWidth: true,
              },
            },
          ],
        },
      ],
    };

    //consolle.log("Loading mock template data:", mockTemplateData);
    setTemplateData(mockTemplateData);
    transformTemplateToSections(mockTemplateData);
  }, [transformTemplateToSections]);

  useEffect(() => {
    getProductData();
    // Auto-load template on page load
    // setIsPreviewMode(true); // Always start in preview mode
    if (templateId) {
      fetchTemplateData(templateId);
    }
  }, [getProductData, templateId, fetchTemplateData]);

  return (
    <div
      className={`min-h-screen ${
        isPreviewMode ? "bg-white" : "bg-gray-100"
      } flex`}
    >
      {!isPreviewMode && (
        <ComponentLibrary
          onAddComponent={addComponent}
          sections={sections}
          columnGap={columnGap}
          componentGap={componentGap}
          rowGap={rowGap}
        />
      )}

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 text-black px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Page Builder</h1>
            <div className="flex items-center gap-4">
              {!isPreviewMode && (
                <>
                  <div className="flex  items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Column Gap:
                    </label>
                    <select
                      value={columnGap}
                      onChange={(e) => setColumnGap(parseInt(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value={0}>None</option>
                      <option value={1}>XS</option>
                      <option value={2}>SM</option>
                      <option value={4}>MD</option>
                      <option value={6}>LG</option>
                      <option value={8}>XL</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Component Gap:
                    </label>
                    <select
                      value={componentGap}
                      onChange={(e) =>
                        setComponentGap(parseInt(e.target.value))
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value={0}>None</option>
                      <option value={1}>XS</option>
                      <option value={2}>SM</option>
                      <option value={4}>MD</option>
                      <option value={6}>LG</option>
                      <option value={8}>XL</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Row Gap:
                    </label>
                    <select
                      value={rowGap}
                      onChange={(e) => setRowGap(parseInt(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value={0}>None</option>
                      <option value={1}>XS</option>
                      <option value={2}>SM</option>
                      <option value={4}>MD</option>
                      <option value={6}>LG</option>
                      <option value={8}>XL</option>
                    </select>
                  </div>
                  <button
                    onClick={addColumn}
                    className="flex items-center gap-2 px-4 py-2 greenOne text-white rounded-lg hover:greenOne transition-colors"
                  >
                    <Plus size={20} />
                    Add Column
                  </button>
                  <button
                    onClick={addNewSection}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Layout size={20} />
                    Add Section
                  </button>
                </>
              )}
              {/* Template Loading Controls */}
              <div className="flex items-center gap-2 border-l pl-4">
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="Template ID"
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
                  disabled={isLoadingTemplate}
                />
                <button
                  onClick={loadTemplate}
                  disabled={isLoadingTemplate || !templateId}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Load template from API"
                >
                  {isLoadingTemplate ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Layout size={16} />
                  )}
                  {isLoadingTemplate ? "Loading..." : "Load Template"}
                </button>
                <button
                  onClick={loadMockTemplate}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  title="Load mock template for testing"
                >
                  <Layout size={16} />
                  Test Mock
                </button>
              </div>
              {/* <button
                // onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPreviewMode
                    ? "bg-gray-200 text-gray-800"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <Eye size={20} />
                {isPreviewMode ? "Edit Mode" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 greenOne text-white rounded-lg hover:greenOne transition-colors"
              >
                <Save size={20} />
                Save
              </button> */}
            </div>
          </div>
        </div>

        {/* Main content - Row-based layout */}
        <div className="flex-1 overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.flatMap((section) =>
                section.type === "columns"
                  ? section.columns.flatMap((col) =>
                      col.components.map((c) => c.id)
                    )
                  : []
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className={`p-4 ${SPACE_CLASSES[rowGap] || "space-y-4"}`}>
                {organizeSectionsForRender().map((row, rowIndex) => {
                  if (row.type === "fullWidth") {
                    return (
                      <SortableItem
                        key={`fullwidth-${row.component.id}`}
                        id={row.component.id}
                        columnId="fullwidth"
                        span={row.component.span}
                        totalColumns={3}
                        isPreviewMode={isPreviewMode}
                      >
                        <div className="w-full">
                          <div
                            className={`relative ${
                              isPreviewMode ? "" : "group"
                            }`}
                          >
                            {!isPreviewMode && (
                              <button
                                onClick={() =>
                                  removeComponent(row.component.id)
                                }
                                className="absolute top-2 left-2 z-40 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                title="Remove component"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <ComponentRenderer
                              component={row.component}
                              product={product}
                              settings={componentSettings}
                              onUpdateSettings={updateComponentSettings}
                              onUpdateSpan={updateComponentSpan}
                              totalColumns={3}
                              isPreviewMode={isPreviewMode}
                              COMPONENT_SPANS={COMPONENT_SPANS}
                            />
                          </div>
                        </div>
                      </SortableItem>
                    );
                  } else {
                    return (
                      <div key={`section-${row.sectionId}-row-${rowIndex}`}>
                        {!isPreviewMode && (
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">
                              Section{" "}
                              {sections.findIndex(
                                (s) => s.id === row.sectionId
                              ) + 1}
                            </h3>
                            {sections.length > 1 && (
                              <button
                                onClick={() => removeSection(row.sectionId)}
                                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Remove Section"
                              >
                                Remove Section
                              </button>
                            )}
                          </div>
                        )}
                        <div
                          className={`flex ${
                            GAP_CLASSES[columnGap] || "gap-2"
                          } ${isPreviewMode ? "" : "mb-6"}`}
                        >
                          {row.sectionColumns.map((column, columnIndex) => (
                            <DroppableColumn
                              key={`${column.id}-row-${rowIndex}`}
                              id={column.id}
                              title={`Column ${columnIndex + 1}`}
                              isEmpty={
                                !row.columns[columnIndex] ||
                                row.columns[columnIndex].length === 0
                              }
                              width={column.width}
                              onWidthChange={(colIndex, width) =>
                                updateColumnWidth(
                                  row.sectionId,
                                  colIndex,
                                  width
                                )
                              }
                              columnIndex={columnIndex}
                              onRemoveColumn={(colIndex) =>
                                removeColumn(row.sectionId, colIndex)
                              }
                              canRemove={row.sectionColumns.length > 1}
                              componentGap={componentGap}
                              isPreviewMode={isPreviewMode}
                            >
                              {row.columns[columnIndex]?.map((component) => (
                                <SortableItem
                                  key={component.id}
                                  id={component.id}
                                  columnId={column.id}
                                  span={component.span}
                                  totalColumns={3}
                                  isPreviewMode={isPreviewMode}
                                >
                                  <div className="relative">
                                    {!isPreviewMode && (
                                      <button
                                        onClick={() =>
                                          removeComponent(component.id)
                                        }
                                        className="absolute top-2 left-2 z-10 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        title="Remove component"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                    <ComponentRenderer
                                      component={component}
                                      product={product}
                                      settings={componentSettings}
                                      onUpdateSettings={updateComponentSettings}
                                      onUpdateSpan={updateComponentSpan}
                                      totalColumns={3}
                                      isPreviewMode={isPreviewMode}
                                      COMPONENT_SPANS={COMPONENT_SPANS}
                                    />
                                  </div>
                                </SortableItem>
                              )) || []}
                            </DroppableColumn>
                          ))}
                        </div>
                      </div>
                    );
                  }
                })}

                {/* Empty state when no sections */}
                {organizeSectionsForRender().length === 0 && (
                  <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                      <div className="text-gray-400 mb-4">
                        <Settings size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Start Building Your Page
                      </h3>
                      <p className="text-gray-600">
                        Add components from the sidebar to begin creating your
                        product page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SortableContext>

            <DragOverlay>
              {draggedComponent ? (
                <div className="bg-white rounded-lg shadow-xl border-2 border-blue-500 p-4 opacity-90 transform rotate-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {draggedComponent.title}
                  </h3>
                  <p className="text-sm text-gray-500">Moving component...</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
