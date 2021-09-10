<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLessonsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
			$table->string('name',255)->default("");
			$table->text('description')->nullable();
			$table->boolean('published')->default(FALSE);
			$table->foreignId('topic_id')->constrained()->onDelete('cascade');;
			$table->integer('order')->default(0);
			$table->enum('type', ['lab', 'theory'])->default('theory');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('lessons');
    }
}
