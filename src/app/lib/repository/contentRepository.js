import homepageSectionSchema from '../models/Content.js';
import userSchema from '../models/User.js';

class ContentRepository {
  constructor(connection) {
    this.connection = connection;
    this.HomepageSection = connection.models.HomepageSection || connection.model('HomepageSection', homepageSectionSchema);
    this.User = connection.models.User || connection.model('User', userSchema);
  }

  // Create a new homepage section
  async createSection(sectionData) {
    try {
      const section = new this.HomepageSection(sectionData);
      return await section.save();
    } catch (error) {
      throw new Error(`Error creating homepage section: ${error.message}`);
    }
  }

  // Bulk create homepage sections
  async bulkCreateSections(sectionsData) {
    try {
      const sections = await this.HomepageSection.insertMany(sectionsData);
      return sections;
    } catch (error) {
      throw new Error(`Error bulk creating homepage sections: ${error.message}`);
    }
  }

  // Get all homepage sections with optional filtering
  async getAllSections(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'order', sortOrder = 'asc' } = options;
      const skip = (page - 1) * limit;
      
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const sections = await this.HomepageSection
        .find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'createdBy',
          select: 'name email',
          model: this.User
        })
        .populate({
          path: 'updatedBy', 
          select: 'name email',
          model: this.User
        })
        .lean();

      const total = await this.HomepageSection.countDocuments(filters);

      return {
        sections,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching homepage sections: ${error.message}`);
    }
  }

  // Get a single homepage section by ID
  async getSectionById(id) {
    try {
      const section = await this.HomepageSection
        .findById(id)
        .populate({
          path: 'createdBy',
          select: 'name email',
          model: this.User
        })
        .populate({
          path: 'updatedBy',
          select: 'name email', 
          model: this.User
        })
        .lean();
      
      if (!section) {
        throw new Error('Homepage section not found');
      }
      
      return section;
    } catch (error) {
      throw new Error(`Error fetching homepage section: ${error.message}`);
    }
  }

  // Get sections by type
  async getSectionsByType(sectionType, isVisible = null) {
    try {
      const filters = { sectionType };
      if (isVisible !== null) {
        filters.isVisible = isVisible;
      }

      return await this.HomepageSection
        .find(filters)
        .sort({ order: 1 })
        .populate({
          path: 'createdBy',
          select: 'name email',
          model: this.User
        })
        .populate({
          path: 'updatedBy',
          select: 'name email',
          model: this.User
        })
        .lean();
    } catch (error) {
      throw new Error(`Error fetching sections by type: ${error.message}`);
    }
  }

  // Update a homepage section
  async updateSection(id, updateData) {
    try {
      const section = await this.HomepageSection.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
      .populate({
        path: 'createdBy',
        select: 'name email',
        model: this.User
      })
      .populate({
        path: 'updatedBy',
        select: 'name email',
        model: this.User
      });

      if (!section) {
        throw new Error('Homepage section not found');
      }

      return section;
    } catch (error) {
      throw new Error(`Error updating homepage section: ${error.message}`);
    }
  }

  // Delete a homepage section
  async deleteSection(id) {
    try {
      const section = await this.HomepageSection.findByIdAndDelete(id);
      
      if (!section) {
        throw new Error('Homepage section not found');
      }

      return { message: 'Homepage section deleted successfully', deletedSection: section };
    } catch (error) {
      throw new Error(`Error deleting homepage section: ${error.message}`);
    }
  }

  // Update section visibility
  async toggleVisibility(id, isVisible) {
    try {
      const section = await this.HomepageSection.findByIdAndUpdate(
        id,
        { isVisible, updatedAt: new Date() },
        { new: true }
      );

      if (!section) {
        throw new Error('Homepage section not found');
      }

      return section;
    } catch (error) {
      throw new Error(`Error updating section visibility: ${error.message}`);
    }
  }

  // Reorder sections
  async reorderSections(sectionsOrder) {
    try {
      const bulkOps = sectionsOrder.map((item, index) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { order: index + 1 }
        }
      }));

      await this.HomepageSection.bulkWrite(bulkOps);
      return { message: 'Sections reordered successfully' };
    } catch (error) {
      throw new Error(`Error reordering sections: ${error.message}`);
    }
  }

  // Get visible sections for frontend
  async getVisibleSections() {
    try {
      return await this.HomepageSection
        .find({ isVisible: true })
        .sort({ order: 1 })
        .select('-createdBy -updatedBy -createdAt -updatedAt')
        .lean();
    } catch (error) {
      throw new Error(`Error fetching visible sections: ${error.message}`);
    }
  }
}

export default ContentRepository;
