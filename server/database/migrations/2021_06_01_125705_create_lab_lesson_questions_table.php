<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLabLessonQuestionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('lab_lesson_questions', function (Blueprint $table) {
            $table->id();
			$table->foreignId('lab_lesson_id')->constrained()->onDelete('cascade');;
			$table->text('answer')->nullable();;
			$table->text('question');
			$table->enum('type', ['yes','string'])->default('string');
			$table->integer('order')->default(0);
			$table->integer('score')->default(0);
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
        Schema::dropIfExists('lab_lesson_questions');
    }
}
