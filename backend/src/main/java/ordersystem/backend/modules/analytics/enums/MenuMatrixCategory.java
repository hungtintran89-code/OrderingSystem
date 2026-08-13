package ordersystem.backend.modules.analytics.enums;

/**
 * Menu Matrix Classification (BCG Matrix for F&B):
 * - STARS: High Volume + High Revenue (Hero Products)
 * - WORKHORSES: High Volume + Low Revenue (Popular items, optimize cost)
 * - PUZZLES: Low Volume + High Revenue (High margin items, push promotions)
 * - DOGS: Low Volume + Low Revenue (Underperforming items, evaluate for removal)
 */
public enum MenuMatrixCategory {
    STARS,
    WORKHORSES,
    PUZZLES,
    DOGS
}
