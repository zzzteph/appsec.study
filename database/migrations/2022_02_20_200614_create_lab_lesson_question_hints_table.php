<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLabLessonQuestionHintsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('lab_lesson_question_hints', function (Blueprint $table) {
            $table->id();
			$table->foreignId('lab_lesson_question_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			$table->integer('price')->default(100);
			$table->text('hint')->default('');
			$table->integer('order')->default(0);
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
        Schema::dropIfExists('lab_lesson_question_hints');
    }
}
