"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Settings } from "lucide-react";
import { COMPONENT_TYPES, ComponentRenderer } from "./ComponentVariants";
import { fetchProductById } from "../store/slices/productSlice";
import { useDispatch } from "react-redux";
import { getImageUrl } from "../utils/imageHelper";

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

export default function ProductDetailPage() {
  const [sections, setSections] = useState([]);
  const [componentSettings, setComponentSettings] = useState({});
  const [columnGap, setColumnGap] = useState(2);
  const [componentGap, setComponentGap] = useState(2);
  const [rowGap, setRowGap] = useState(4);
  const [product, setProduct] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [templateId, setTemplateId] = useState("688b2517677656ae9f8a73aa");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

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
      return;
    }

    //consolle.log("Template has", template.columns.length, "columns");

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
    setColumnGap(Math.min(Math.max(template.columnGap || 20, 0) / 4, 8));
    setComponentGap(Math.min(Math.max(template.componentGap || 16, 0) / 4, 8));
    setRowGap(Math.min(Math.max(template.rowGap || 24, 0) / 4, 8));

    // Create new section based on template
    const newSection = {
      id: `section-template-${Date.now()}`,
      type: "columns",
      order: 0,
      columns: template.columns.map((templateColumn, index) => ({
        id: `column-template-${index + 1}`,
        width: Math.ceil((templateColumn.columnWidth || 33) / 33),
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
            ),
            order: templateComponent.sortOrder || compIndex,
            templateSettings: templateComponent.settings || {},
            isVisible: templateComponent.isVisible !== false,
            variant: templateComponent.componentVariant || "default",
          })
        ),
      })),
    };

    //consolle.log("New section created:", newSection);
    setSections([newSection]);

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

  // Test function to load mock template data
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
        setTemplateData(templateData);

        // Check if templateData has the expected structure
        if (templateData && templateData.data) {
          transformTemplateToSections(templateData.data);
        } else if (templateData) {
          transformTemplateToSections(templateData);
        } else {
          //consolle.error("Template data is null or undefined");
        }
      } catch (error) {
        //consolle.error("Error fetching template data:", error);
        // Load mock template if API fails
        loadMockTemplate();
      } finally {
        setIsLoadingTemplate(false);
      }
    },
    [transformTemplateToSections, loadMockTemplate]
  );

  // Function to organize sections for rendering
  const organizeSectionsForRender = useCallback(() => {
    const sortedSections = [...sections].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    const renderSections = [];

    for (const section of sortedSections) {
      if (section.type === "columns") {
        const allComponents = section.columns.flatMap((col, colIndex) =>
          col.components.map((comp) => ({
            ...comp,
            originalColumnIndex: colIndex,
            sectionId: section.id,
          }))
        );

        allComponents.sort((a, b) => (a.order || 0) - (b.order || 0));

        const rows = [];
        let currentRowComponents = [];
        let currentRowByColumn = Array(section.columns.length)
          .fill(null)
          .map(() => []);

        for (const component of allComponents) {
          if (component.span === 3) {
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

            rows.push({
              type: "fullWidth",
              component: component,
              sectionId: section.id,
            });
          } else {
            currentRowComponents.push(component);
            currentRowByColumn[component.originalColumnIndex].push(component);
          }
        }

        if (currentRowComponents.length > 0) {
          rows.push({
            type: "columns",
            components: currentRowComponents,
            columns: currentRowByColumn,
            sectionId: section.id,
            sectionColumns: section.columns,
          });
        }

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

  useEffect(() => {
    getProductData();
    // Auto-load template on page load
    if (templateId) {
      fetchTemplateData(templateId);
    }
  }, [getProductData, templateId, fetchTemplateData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Loading indicator */}
      {(isLoadingTemplate || !product) && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLoadingTemplate
                ? "Loading template..."
                : "Loading product data..."}
            </p>
          </div>
        </div>
      )}

      {/* Template Content */}
      {!isLoadingTemplate && product && (
        <div className="p-4">
          {organizeSectionsForRender().map((row, rowIndex) => {
            if (row.type === "fullWidth") {
              return (
                <div
                  key={`fullwidth-${row.component.id}`}
                  className="w-full mb-4"
                >
                  <ComponentRenderer
                    component={row.component}
                    product={product}
                    settings={componentSettings}
                    onUpdateSettings={() => {}} // No-op for preview mode
                    onUpdateSpan={() => {}} // No-op for preview mode
                    totalColumns={3}
                    isPreviewMode={true}
                    COMPONENT_SPANS={COMPONENT_SPANS}
                  />
                </div>
              );
            } else {
              return (
                <div
                  key={`section-${row.sectionId}-row-${rowIndex}`}
                  className="mb-4"
                >
                  <div className={`flex ${GAP_CLASSES[columnGap] || "gap-2"}`}>
                    {row.sectionColumns.map((column, columnIndex) => (
                      <div
                        key={`${column.id}-row-${rowIndex}`}
                        className={`${
                          COLUMN_WIDTHS[column.width]?.flex || "flex-1"
                        }`}
                      >
                        {row.columns[columnIndex]?.map((component) => (
                          <div key={component.id} className="mb-2">
                            <ComponentRenderer
                              component={component}
                              product={product}
                              settings={componentSettings}
                              onUpdateSettings={() => {}} // No-op for preview mode
                              onUpdateSpan={() => {}} // No-op for preview mode
                              totalColumns={3}
                              isPreviewMode={true}
                              COMPONENT_SPANS={COMPONENT_SPANS}
                            />
                          </div>
                        )) || []}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          })}

          {/* Empty state when no template is loaded */}
          {organizeSectionsForRender().length === 0 && !isLoadingTemplate && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <Settings size={48} className="mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No Template Loaded
                </h3>
                <p className="text-gray-600">
                  Template ID &quot;{templateId}&quot; could not be loaded.
                </p>
                <button
                  onClick={loadMockTemplate}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Load Demo Template
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
