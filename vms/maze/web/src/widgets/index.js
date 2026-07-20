// widget registry — 12 collection render styles (CSS in styles.css under .coll.<name>).
import CardsWidget from './CardsWidget.vue'
import GridWidget from './GridWidget.vue'
import ListWidget from './ListWidget.vue'
import TableWidget from './TableWidget.vue'
import MasonryWidget from './MasonryWidget.vue'
import CarouselWidget from './CarouselWidget.vue'
import GalleryWidget from './GalleryWidget.vue'
import TilesWidget from './TilesWidget.vue'
import CompactWidget from './CompactWidget.vue'
import FeedWidget from './FeedWidget.vue'
import KanbanWidget from './KanbanWidget.vue'
import TimelineWidget from './TimelineWidget.vue'
export const WIDGETS = { cards: CardsWidget, grid: GridWidget, list: ListWidget, table: TableWidget, masonry: MasonryWidget, carousel: CarouselWidget, gallery: GalleryWidget, tiles: TilesWidget, compact: CompactWidget, feed: FeedWidget, kanban: KanbanWidget, timeline: TimelineWidget }
export const WIDGET_NAMES = ['cards', 'grid', 'list', 'table', 'masonry', 'carousel', 'gallery', 'tiles', 'compact', 'feed', 'kanban', 'timeline']
